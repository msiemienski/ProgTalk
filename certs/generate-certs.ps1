# PowerShell script to generate self-signed SSL certificates for development

Write-Host "🔐 Generating self-signed SSL certificates for development..." -ForegroundColor Cyan

$certPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$keyPath = Join-Path $certPath "server.key"
$certFile = Join-Path $certPath "server.cert"

# Generate self-signed certificate using PowerShell
$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "backend", "frontend", "127.0.0.1" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(1) `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -Subject "CN=localhost, O=ProgTalk, OU=Development, C=PL"

# Export certificate
$certPassword = ConvertTo-SecureString -String "temp" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath (Join-Path $certPath "server.pfx") -Password $certPassword | Out-Null

# Convert to PEM format using OpenSSL (if available)
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    # Extract certificate
    openssl pkcs12 -in (Join-Path $certPath "server.pfx") -clcerts -nokeys -out $certFile -password pass:temp -legacy
    # Extract private key
    openssl pkcs12 -in (Join-Path $certPath "server.pfx") -nocerts -nodes -out $keyPath -password pass:temp -legacy
    
    # Remove temporary PFX file
    Remove-Item (Join-Path $certPath "server.pfx") -Force
    
    Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "   Key: $keyPath" -ForegroundColor Gray
    Write-Host "   Certificate: $certFile" -ForegroundColor Gray
} else {
    Write-Host "⚠️  OpenSSL not found. Installing via Chocolatey..." -ForegroundColor Yellow
    Write-Host "   Please install OpenSSL manually or use WSL to run generate-certs.sh" -ForegroundColor Yellow
    Write-Host "   Chocolatey: choco install openssl" -ForegroundColor Gray
    Write-Host "   WSL: bash ./certs/generate-certs.sh" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚠️  Note: These are self-signed certificates for development only." -ForegroundColor Yellow
Write-Host "   Your browser will show a security warning - this is expected." -ForegroundColor Yellow

# Clean up certificate from store
Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
