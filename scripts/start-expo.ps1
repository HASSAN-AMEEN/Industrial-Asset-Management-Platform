#!/usr/bin/env pwsh
# Run from repository root. Detect LAN IP, update envs, then start Expo bound to the LAN IP.
node ./scripts/set-lan-ip.js

# Get the detected IP from Node (same detection logic)
$ip = node -e "const os=require('os');const ifaces=os.networkInterfaces();for(const k in ifaces){for(const i of ifaces[k]){if(i.family==='IPv4' && !i.internal){if(/^(10\.|192\\.168\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\.)/.test(i.address)){console.log(i.address);process.exit(0);}}}}for(const k in ifaces){for(const i of ifaces[k]){if(i.family==='IPv4' && !i.internal){console.log(i.address);process.exit(0);}}}console.error('no-ip');process.exit(1)"
if ($LASTEXITCODE -ne 0) { Write-Error 'Failed to detect LAN IP'; exit 1 }

Write-Output "Starting Expo with REACT_NATIVE_PACKAGER_HOSTNAME=$ip"
$env:REACT_NATIVE_PACKAGER_HOSTNAME=$ip
Set-Location -Path ./mobile
npx expo start --host lan
