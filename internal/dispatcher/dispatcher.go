// Package dispatcher implements a TruffleHog ResultsDispatcher that accumulates
// findings into a slice for consumption by the scanner service.
package dispatcher

import (
	"encoding/json"
	"fmt"
	"sync"

	thctx "github.com/trufflesecurity/trufflehog/v3/pkg/context"
	"github.com/trufflesecurity/trufflehog/v3/pkg/detectors"

	"github.com/clysec/secretpig-api/internal/models"
)

// Collector implements engine.ResultsDispatcher and accumulates all dispatched
// findings thread-safely.
type Collector struct {
	mu       sync.Mutex
	findings []models.Finding
	count    int // total dispatched (before deduplication by engine)
}

// New returns a ready-to-use Collector.
func New() *Collector {
	return &Collector{findings: make([]models.Finding, 0)}
}

// Dispatch is called by the TruffleHog engine for each result that passes its
// internal filters. It converts the engine result to our Finding model and
// appends it to the collection.
func (c *Collector) Dispatch(_ thctx.Context, result detectors.ResultWithMetadata) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.count++
	c.findings = append(c.findings, toFinding(result))
	return nil
}

// Findings returns a snapshot of all collected findings.
func (c *Collector) Findings() []models.Finding {
	c.mu.Lock()
	defer c.mu.Unlock()

	out := make([]models.Finding, len(c.findings))
	copy(out, c.findings)
	return out
}

// Count returns the total number of results dispatched.
func (c *Collector) Count() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.count
}

// toFinding converts a TruffleHog ResultWithMetadata to our Finding model.
func toFinding(r detectors.ResultWithMetadata) models.Finding {
	f := models.Finding{
		Verified:    r.Result.Verified,
		SourceType:  r.SourceType.String(),
		SourceName:  r.SourceName,
		DecoderType: r.DecoderType.String(),
	}

	// Detector information (Result is a value type, always present).
	f.DetectorName = r.Result.DetectorType.String()
	f.DetectorType = fmt.Sprintf("%d", int32(r.Result.DetectorType))
	f.Redacted = r.Result.Redacted

	if len(r.Result.Raw) > 0 {
		f.Raw = string(r.Result.Raw)
	}
	if len(r.Result.RawV2) > 0 {
		f.RawV2 = string(r.Result.RawV2)
	}
	if len(r.Result.ExtraData) > 0 {
		f.ExtraData = r.Result.ExtraData
	}

	// Source metadata — marshal to generic map so the HTTP layer can JSON-encode it.
	if r.SourceMetadata != nil {
		raw, err := json.Marshal(r.SourceMetadata)
		if err == nil {
			var m map[string]interface{}
			if err := json.Unmarshal(raw, &m); err == nil {
				f.SourceMetadata = m
			}
		}
	}

	return f
}
