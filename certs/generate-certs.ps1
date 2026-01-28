# Self-signed certificate generation script for Windows (PowerShell)

$subj = "/C=PL/ST=Poland/L=Warsaw/O=ProgTalk/OU=Development/CN=localhost"

# Check if OpenSSL is installed
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.cert -subj $subj
    Write-Host "✅ Certificates generated successfully using OpenSSL." -ForegroundColor Green
} else {
    Write-Host "❌ OpenSSL not found! Please install OpenSSL or use the Docker method mentioned in README." -ForegroundColor Red
}
