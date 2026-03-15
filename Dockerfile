FROM alpine:latest

RUN apk --no-cache add ca-certificates git curl bash yq jq && update-ca-certificates --fresh

ARG TARGETPLATFORM
COPY $TARGETPLATFORM/secretpig-api /usr/bin/secretpig

ENTRYPOINT ["/usr/bin/secretpig"]