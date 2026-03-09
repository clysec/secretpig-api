FROM alpine:latest AS get-ca

RUN apk --no-cache add ca-certificates && update-ca-certificates --fresh

FROM scratch

ARG TARGETPLATFORM
COPY $TARGETPLATFORM/secretpig /usr/bin/secretpig
COPY --from=get-ca /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENTRYPOINT ["/usr/bin/secretpig"]