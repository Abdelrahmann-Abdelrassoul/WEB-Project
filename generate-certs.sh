#!/bin/sh
# Generates a self-signed certificate for localhost
# Run once from the project root: sh nginx/generate-certs.sh

mkdir -p nginx/certs

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out    nginx/certs/cert.pem \
  -subj   "/C=US/ST=Local/L=Local/O=Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✓ Certificates written to nginx/certs/"