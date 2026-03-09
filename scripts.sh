# Build (requires libre2-dev for RE2; WASM backend panics on this system)
sudo apt-get install libre2-dev
CGO_ENABLED=1 go build -tags re2_cgo .

# Tests
CGO_ENABLED=1 go test ./tests/ -tags re2_cgo -v

# Regenerate OpenAPI docs
$(go env GOPATH)/bin/swag init --generalInfo main.go --output docs
