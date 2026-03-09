// Package config loads application configuration from defaults, an optional
// config file (YAML or JSON), and environment variable overrides.
//
// Priority order (highest wins): environment variables > config file > defaults.
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Config is the top-level application configuration.
type Config struct {
	// ListenAddr is the TCP address the server listens on (e.g. ":8080").
	ListenAddr string `yaml:"listen_addr" json:"listen_addr"`

	// Auth controls API authentication.
	Auth AuthConfig `yaml:"auth" json:"auth"`
}

// AuthConfig selects and configures the authentication method.
type AuthConfig struct {
	// Mode selects the auth method: none | token | jwt | oidc.
	// Default: none (API is open).
	Mode string `yaml:"mode" json:"mode"`

	// Token is the shared secret used when Mode == "token".
	// Clients must send:  Authorization: Bearer <token>
	Token string `yaml:"token" json:"token"`

	// JWT configures JWT validation when Mode == "jwt".
	JWT JWTConfig `yaml:"jwt" json:"jwt"`

	// OIDC configures OpenID Connect token validation when Mode == "oidc".
	OIDC OIDCConfig `yaml:"oidc" json:"oidc"`
}

// JWTConfig holds parameters for validating JWTs with a local secret or key.
type JWTConfig struct {
	// Secret is the HMAC-SHA256 signing secret (mutually exclusive with PublicKey).
	Secret string `yaml:"secret" json:"secret"`

	// PublicKey is a PEM-encoded RSA or EC public key (for RS256/ES256 tokens).
	PublicKey string `yaml:"public_key" json:"public_key"`

	// Issuer is the expected value of the "iss" claim (optional).
	Issuer string `yaml:"issuer" json:"issuer"`

	// Audience is the expected value of the "aud" claim (optional).
	Audience string `yaml:"audience" json:"audience"`
}

// OIDCConfig holds parameters for validating tokens via an OpenID Connect provider.
type OIDCConfig struct {
	// Issuer is the OIDC provider URL (e.g. "https://accounts.google.com").
	// The discovery document is fetched from {Issuer}/.well-known/openid-configuration.
	Issuer string `yaml:"issuer" json:"issuer"`

	// ClientID is the expected audience claim value.
	ClientID string `yaml:"client_id" json:"client_id"`
}

// defaults returns a Config with all default values applied.
func defaults() Config {
	return Config{
		ListenAddr: ":8080",
		Auth:       AuthConfig{Mode: "none"},
	}
}

// Load reads configuration with the following precedence:
//  1. Defaults
//  2. Config file (path from SP_CONFIG_FILE, or first of ./config.yaml / ./config.json)
//  3. Environment variables (SP_* prefix)
func Load() (*Config, error) {
	cfg := defaults()

	if err := loadFile(&cfg); err != nil {
		return nil, err
	}

	applyEnv(&cfg)

	return &cfg, nil
}

// loadFile merges a config file into cfg if one can be found.
func loadFile(cfg *Config) error {
	path := resolveConfigFile()
	if path == "" {
		return nil // no file — use defaults + env
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("reading config file %q: %w", path, err)
	}

	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".yaml", ".yml":
		if err := yaml.Unmarshal(data, cfg); err != nil {
			return fmt.Errorf("parsing YAML config %q: %w", path, err)
		}
	case ".json":
		if err := json.Unmarshal(data, cfg); err != nil {
			return fmt.Errorf("parsing JSON config %q: %w", path, err)
		}
	default:
		return fmt.Errorf("unsupported config file extension %q (want .yaml/.yml/.json)", ext)
	}

	return nil
}

// resolveConfigFile returns the config file path to use, or "" if none found.
func resolveConfigFile() string {
	if p := os.Getenv("SP_CONFIG_FILE"); p != "" {
		return p
	}
	for _, candidate := range []string{"config.yaml", "config.yml", "config.json"} {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return ""
}

// applyEnv overrides cfg fields with values from SP_* environment variables.
func applyEnv(cfg *Config) {
	if v := coalesce(os.Getenv("SP_LISTEN_ADDR"), os.Getenv("LISTEN_ADDR")); v != "" {
		cfg.ListenAddr = v
	}
	if v := os.Getenv("SP_AUTH_MODE"); v != "" {
		cfg.Auth.Mode = v
	}
	if v := os.Getenv("SP_AUTH_TOKEN"); v != "" {
		cfg.Auth.Token = v
	}
	if v := os.Getenv("SP_AUTH_JWT_SECRET"); v != "" {
		cfg.Auth.JWT.Secret = v
	}
	if v := os.Getenv("SP_AUTH_JWT_PUBLIC_KEY"); v != "" {
		cfg.Auth.JWT.PublicKey = v
	}
	if v := os.Getenv("SP_AUTH_JWT_ISSUER"); v != "" {
		cfg.Auth.JWT.Issuer = v
	}
	if v := os.Getenv("SP_AUTH_JWT_AUDIENCE"); v != "" {
		cfg.Auth.JWT.Audience = v
	}
	if v := os.Getenv("SP_AUTH_OIDC_ISSUER"); v != "" {
		cfg.Auth.OIDC.Issuer = v
	}
	if v := os.Getenv("SP_AUTH_OIDC_CLIENT_ID"); v != "" {
		cfg.Auth.OIDC.ClientID = v
	}
}

// coalesce returns the first non-empty string.
func coalesce(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
