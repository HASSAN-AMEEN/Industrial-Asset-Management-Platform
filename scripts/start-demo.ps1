#!/usr/bin/env pwsh
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

# Configure the app for remote demo use. Expo tunnel only carries the JS bundle;
# the API must be reachable at a public URL.
node ./scripts/set-demo-env.js --api-url $ApiUrl

Set-Location -Path ./mobile
npx expo start --tunnel --port 8082 --clear
