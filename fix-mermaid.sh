#!/bin/sh

# 1. Clean out the broken Puppeteer download cache
echo "Cleaning Puppeteer cache..."
rm -rf /home/laradock/.cache/puppeteer

# 2. Re-install project node modules cleanly
echo "Reinstalling Node modules..."
rm -rf node_modules package-lock.json
npm install

# 3. Download the specific headless browser Puppeteer is looking for
# This puts the exact chrome-headless-shell binary directly into your cache folder
echo "Downloading Puppeteer headless shell..."
npx puppeteer browsers install chrome-headless-shell

# 4. Install missing user-space fonts to fix the truncated labels
# Since we don't have sudo, we fetch standard liberation fonts directly 
# and place them into the user's font directory
echo "Configuring user-space fonts..."
mkdir -p /home/laradock/.local/share/fonts
wget -qO- https://github.com | tar -xzf - --wildcards 'fonts-main/ofl/liberationsans/*.ttf'
mv fonts-main/ofl/liberationsans/*.ttf /home/laradock/.local/share/fonts/
rm -rf fonts-main

# 5. Re-index user fonts so Chromium notices them immediately
fc-cache -f -v

echo "Fix complete! You can now run your Mermaid script."