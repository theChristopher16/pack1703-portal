#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate version.json with current timestamp and build info
const versionInfo = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  buildHash: process.env.BUILD_HASH || Date.now().toString(36),
  gitCommit: process.env.GIT_COMMIT || 'unknown',
  environment: process.env.NODE_ENV || 'development'
};

// Write to build directory
const buildDir = path.join(__dirname, '..', 'build');
const versionPath = path.join(buildDir, 'version.json');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
console.log('✅ Generated version.json:', versionInfo);

// Also write to public directory for development
const publicDir = path.join(__dirname, '..', 'public');
const publicVersionPath = path.join(publicDir, 'version.json');
fs.writeFileSync(publicVersionPath, JSON.stringify(versionInfo, null, 2));
console.log('✅ Generated version.json for development');
