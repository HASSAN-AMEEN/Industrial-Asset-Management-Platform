const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable problematic Node.js experimental features on Windows
config.resolver.nodeExperiments = undefined;
// Force legacy externals handling to avoid node:sea path issue
config.resolver.enableGlobalPackages = false;
config.resolver.alias = {
  ...config.resolver.alias,
  'node:sea': false,
};

module.exports = config;
