// Package middleware provides Gin middleware for the SecretPig API.
package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	jwtv5 "github.com/golang-jwt/jwt/v5"

	"github.com/clysec/secretpig-api/internal/config"
)

// Auth returns a Gin middleware that enforces the configured authentication
// method. It only protects routes on which it is installed; the /health,
// /swagger, and UI routes are not affected.
//
// When Mode is "none" (default), the middleware is a no-op.
func Auth(cfg config.AuthConfig) gin.HandlerFunc {
	switch strings.ToLower(cfg.Mode) {
	case "token":
		return tokenAuth(cfg.Token)
	case "jwt":
		return jwtAuth(cfg.JWT)
	case "oidc":
		return oidcAuth(cfg.OIDC)
	default:
		return func(c *gin.Context) { c.Next() }
	}
}

// ── Token auth ────────────────────────────────────────────────────────────────

func tokenAuth(token string) gin.HandlerFunc {
	if token == "" {
		panic("auth mode is \"token\" but auth.token is empty")
	}
	expected := "Bearer " + token
	return func(c *gin.Context) {
		if c.GetHeader("Authorization") != expected {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or missing token"})
			return
		}
		c.Next()
	}
}

// ── JWT auth ──────────────────────────────────────────────────────────────────

func jwtAuth(cfg config.JWTConfig) gin.HandlerFunc {
	var keyFunc jwtv5.Keyfunc

	switch {
	case cfg.Secret != "":
		secret := []byte(cfg.Secret)
		keyFunc = func(t *jwtv5.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwtv5.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return secret, nil
		}

	case cfg.PublicKey != "":
		pub, err := jwtv5.ParseRSAPublicKeyFromPEM([]byte(cfg.PublicKey))
		if err != nil {
			// Try EC key.
			ecPub, ecErr := jwtv5.ParseECPublicKeyFromPEM([]byte(cfg.PublicKey))
			if ecErr != nil {
				panic(fmt.Sprintf("auth.jwt.public_key is not a valid RSA or EC PEM key: %v / %v", err, ecErr))
			}
			keyFunc = func(t *jwtv5.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwtv5.SigningMethodECDSA); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return ecPub, nil
			}
		} else {
			keyFunc = func(t *jwtv5.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwtv5.SigningMethodRSA); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return pub, nil
			}
		}

	default:
		panic("auth mode is \"jwt\" but neither auth.jwt.secret nor auth.jwt.public_key is set")
	}

	opts := buildParserOpts(cfg.Issuer, cfg.Audience)

	return func(c *gin.Context) {
		raw := bearerToken(c)
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}
		_, err := jwtv5.Parse(raw, keyFunc, opts...)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid JWT: " + err.Error()})
			return
		}
		c.Next()
	}
}

// ── OIDC auth ─────────────────────────────────────────────────────────────────

func oidcAuth(cfg config.OIDCConfig) gin.HandlerFunc {
	if cfg.Issuer == "" {
		panic("auth mode is \"oidc\" but auth.oidc.issuer is empty")
	}

	client := &jwksClient{issuer: cfg.Issuer}

	opts := buildParserOpts(cfg.Issuer, cfg.ClientID)

	return func(c *gin.Context) {
		raw := bearerToken(c)
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		keyFunc, err := client.keyFunc()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "OIDC configuration error: " + err.Error()})
			return
		}

		if _, err := jwtv5.Parse(raw, keyFunc, opts...); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid OIDC token: " + err.Error()})
			return
		}
		c.Next()
	}
}

// ── JWKS client ───────────────────────────────────────────────────────────────

// jwksClient fetches and caches RSA public keys from an OIDC provider's JWKS
// endpoint. Keys are refreshed at most once per hour or when an unknown kid is seen.
type jwksClient struct {
	issuer string

	mu        sync.RWMutex
	keys      map[string]*rsa.PublicKey
	fetchedAt time.Time
}

const jwksCacheTTL = time.Hour

type jwk struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type jwks struct {
	Keys []jwk `json:"keys"`
}

type oidcDiscovery struct {
	JWKSURI string `json:"jwks_uri"`
}

func (c *jwksClient) keyFunc() (jwtv5.Keyfunc, error) {
	if err := c.ensureLoaded(false); err != nil {
		return nil, err
	}
	return func(t *jwtv5.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwtv5.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method %v; OIDC requires RS256", t.Header["alg"])
		}
		kid, _ := t.Header["kid"].(string)

		c.mu.RLock()
		key, ok := c.keys[kid]
		c.mu.RUnlock()
		if ok {
			return key, nil
		}

		// Unknown kid — refresh once.
		if err := c.ensureLoaded(true); err != nil {
			return nil, err
		}
		c.mu.RLock()
		key, ok = c.keys[kid]
		c.mu.RUnlock()
		if !ok {
			return nil, fmt.Errorf("no JWKS key found for kid %q", kid)
		}
		return key, nil
	}, nil
}

func (c *jwksClient) ensureLoaded(force bool) error {
	c.mu.RLock()
	fresh := !force && c.keys != nil && time.Since(c.fetchedAt) < jwksCacheTTL
	c.mu.RUnlock()
	if fresh {
		return nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	// Double-check after acquiring write lock.
	if !force && c.keys != nil && time.Since(c.fetchedAt) < jwksCacheTTL {
		return nil
	}

	uri, err := c.discoverJWKSURI()
	if err != nil {
		return err
	}
	keys, err := fetchJWKS(uri)
	if err != nil {
		return err
	}
	c.keys = keys
	c.fetchedAt = time.Now()
	return nil
}

func (c *jwksClient) discoverJWKSURI() (string, error) {
	url := strings.TrimRight(c.issuer, "/") + "/.well-known/openid-configuration"
	//nolint:gosec // URL is from operator-supplied config, not user input.
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("fetching OIDC discovery document: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading OIDC discovery response: %w", err)
	}

	var doc oidcDiscovery
	if err := json.Unmarshal(body, &doc); err != nil {
		return "", fmt.Errorf("parsing OIDC discovery document: %w", err)
	}
	if doc.JWKSURI == "" {
		return "", fmt.Errorf("OIDC discovery document has no jwks_uri")
	}
	return doc.JWKSURI, nil
}

func fetchJWKS(uri string) (map[string]*rsa.PublicKey, error) {
	//nolint:gosec // URL comes from operator-controlled OIDC discovery.
	resp, err := http.Get(uri)
	if err != nil {
		return nil, fmt.Errorf("fetching JWKS from %q: %w", uri, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading JWKS response: %w", err)
	}

	var set jwks
	if err := json.Unmarshal(body, &set); err != nil {
		return nil, fmt.Errorf("parsing JWKS: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(set.Keys))
	for _, k := range set.Keys {
		if k.Kty != "RSA" {
			continue
		}
		pub, err := jwkToRSA(k)
		if err != nil {
			continue // skip malformed keys
		}
		keys[k.Kid] = pub
	}
	return keys, nil
}

func jwkToRSA(k jwk) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, fmt.Errorf("decoding JWK modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, fmt.Errorf("decoding JWK exponent: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	var eBig big.Int
	eBig.SetBytes(eBytes)

	return &rsa.PublicKey{N: n, E: int(eBig.Int64())}, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func bearerToken(c *gin.Context) string {
	h := c.GetHeader("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(h, "Bearer ")
}

func buildParserOpts(issuer, audience string) []jwtv5.ParserOption {
	var opts []jwtv5.ParserOption
	if issuer != "" {
		opts = append(opts, jwtv5.WithIssuer(issuer))
	}
	if audience != "" {
		opts = append(opts, jwtv5.WithAudience(audience))
	}
	opts = append(opts, jwtv5.WithExpirationRequired())
	return opts
}
