#!/bin/bash
# Self-signed certificate generation script for Linux/Mac

SUBJ="/C=PL/ST=Poland/L=Warsaw/O=ProgTalk/OU=Development/CN=localhost"

if command -v openssl &> /dev/null
then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.cert -subj "$SUBJ"
    echo "✅ Certificates generated successfully using OpenSSL."
else
    echo "❌ OpenSSL not found! Please install OpenSSL or use the Docker method mentioned in README."
    exit 1
fi
