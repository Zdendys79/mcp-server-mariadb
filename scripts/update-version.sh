#!/bin/bash
# Update package.json version with git commit hash or timestamp
# Priority: git short hash > timestamp (YYYY-MM-DD-HH-MM-SS)

# Try to get git short hash (7 chars)
VERSION=$(git rev-parse --short HEAD 2>/dev/null)

# If git fails (not a git repo or no commits), use timestamp
if [ -z "$VERSION" ]; then
    VERSION=$(date +%Y-%m-%d-%H-%M-%S)
fi

# Update package.json version field
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Version updated to: $VERSION"
