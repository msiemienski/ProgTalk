# SSL Certificates Directory

This directory contains SSL certificates for HTTPS/WSS development.

## Generating Certificates

### Option 1: Using OpenSSL (Recommended)

**Windows (with OpenSSL installed):**
```powershell
openssl genrsa -out server.key 2048
openssl req -new -x509 -key server.key -out server.cert -days 365 

```

**Linux/Mac:**
```bash
chmod +x generate-certs.sh
./generate-certs.sh
```

### Option 2: Using Docker

If you don't have OpenSSL installed, you can generate certificates using Docker:

```bash
docker run --rm -v ${PWD}:/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/server.key -out /certs/server.cert -subj "/C=PL/ST=Poland/L=Warsaw/O=ProgTalk/OU=Development/CN=localhost"
```

### Option 3: Let the application run without SSL

The backend server will automatically fall back to HTTP if certificates are not found.

## Files

- `server.key` - Private key (gitignored)
- `server.cert` - Certificate (gitignored)
- `generate-certs.sh` - Bash script for Linux/Mac
- `generate-certs.ps1` - PowerShell script for Windows

## Security Note

⚠️ These are self-signed certificates for **development only**. Never use them in production!
