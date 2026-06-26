param(
  [ValidateSet('wifi', 'tunnel')]
  [string]$Mode = 'wifi',

  [string]$ApiUrl
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$mobilePath = Join-Path $repoRoot 'mobile'

function Start-Backend {
  Start-Process powershell -WorkingDirectory $backendPath -ArgumentList '-NoExit', '-Command', 'npm run dev'
}

function Start-MobileWifi {
  node (Join-Path $repoRoot 'scripts\set-lan-ip.js') | Out-Host
  $ip = node -e "const os=require('os');const ifaces=os.networkInterfaces();for(const k in ifaces){for(const i of ifaces[k]){if(i.family==='IPv4' && !i.internal){if(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(i.address)){console.log(i.address);process.exit(0);}}}}for(const k in ifaces){for(const i of ifaces[k]){if(i.family==='IPv4' && !i.internal){console.log(i.address);process.exit(0);}}}process.exit(1)"
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip.Trim()
  Start-Process powershell -WorkingDirectory $mobilePath -ArgumentList '-NoExit', '-Command', 'npx expo start --host lan --port 8082'
}

function Start-MobileTunnel {
  if ($ApiUrl) {
    node (Join-Path $repoRoot 'scripts\set-demo-env.js') --api-url $ApiUrl | Out-Host
  }
  Start-Process powershell -WorkingDirectory $mobilePath -ArgumentList '-NoExit', '-Command', 'npx expo start --tunnel --port 8082 --clear'
}

switch ($Mode) {
  'wifi' {
    Start-Backend
    Start-MobileWifi
  }
  'tunnel' {
    Start-Backend
    Start-MobileTunnel
  }
}
