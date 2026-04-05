# Request a password reset token (server must be running: node Server.js)
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string] $Email
)

$port = '3000'
$mailEnv = Join-Path $PSScriptRoot 'Mail.env'
if (Test-Path $mailEnv) {
    Get-Content $mailEnv | ForEach-Object {
        if ($_ -match '^\s*PORT\s*=\s*(\d+)\s*$') { $port = $Matches[1] }
    }
}
if ($env:PORT) { $port = $env:PORT }
$uri = "http://127.0.0.1:$port/forgot-password"

# Build JSON manually so property is always lowercase "email" (PowerShell ConvertTo-Json can use "Email" and break Express)
$escaped = $Email.Replace('\', '\\').Replace('"', '\"')
$body = "{`"email`":`"$escaped`"}"

function Show-TokenResponse {
    param([string] $JsonText)
    $clean = $JsonText.TrimStart([char]0xFEFF)
    try {
        $r = $clean | ConvertFrom-Json
    } catch {
        Write-Host "Could not parse JSON. Raw output:" -ForegroundColor Red
        Write-Host $JsonText
        exit 1
    }
    Write-Host "Response:" -ForegroundColor Cyan
    $r | ConvertTo-Json -Depth 5
    Write-Host ""
    $tok = $null
    if ($r.PSObject.Properties.Match('token').Count -gt 0) { $tok = $r.token }
    if ($null -ne $tok -and $tok -ne '') {
        Write-Host "TOKEN (copy this):" -ForegroundColor Green
        Write-Host $tok
    } else {
        Write-Host "No token in response." -ForegroundColor Yellow
        if ($r.message) { Write-Host $r.message }
        if ($r.error) { Write-Host "Error:" $r.error }
        if ($r.hint) { Write-Host "Hint:" $r.hint }
        Write-Host ""
        Write-Host "Try: node get-reset-token.js <email>   (same folder, server must be running)" -ForegroundColor Cyan
        Write-Host "Or seed DB: node seed-auth-users.js" -ForegroundColor Cyan
        Write-Host "List emails (AUTH_DEBUG=true): open http://127.0.0.1:$port/debug/auth-emails" -ForegroundColor Cyan
    }
}

# Prefer curl.exe (reliable JSON on Windows); fallback to Invoke-WebRequest
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) {
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tmp, $body, (New-Object System.Text.UTF8Encoding $false))
        $out = & curl.exe -s -X POST $uri -H "Content-Type: application/json; charset=utf-8" --data-binary "@$tmp"
        if ($LASTEXITCODE -ne 0) { throw "curl exited with $LASTEXITCODE" }
        Show-TokenResponse -JsonText $out
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
    exit 0
}

try {
    $resp = Invoke-WebRequest -Uri $uri -Method POST -ContentType 'application/json; charset=utf-8' -Body $body -UseBasicParsing
} catch {
    Write-Host "HTTP request failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}

Show-TokenResponse -JsonText $resp.Content
