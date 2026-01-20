#!/bin/bash

# Script to generate self-signed SSL certificates for development

echo "🔐 Generating self-signed SSL certificates for development..."

# Create certs directory if it doesn't exist
mkdir -p "$(dirname "$0")"

# Generate private key
openssl genrsa -out "$(dirname "$0")/server.key" 2048

# Generate certificate signing request and self-signed certificate
openssl req -new -x509 -key "$(dirname "$0")/server.key" -out "$(dirname "$0")/server.cert" -days 365 \
  -subj "/C=PL/ST=Poland/L=Warsaw/O=ProgTalk/OU=Development/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:backend,DNS:frontend,IP:127.0.0.1"

echo "✅ SSL certificates generated successfully!"
echo "   Key: $(dirname "$0")/server.key"
echo "   Certificate: $(dirname "$0")/server.cert"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   Your browser will show a security warning - this is expected."
