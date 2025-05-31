#!/bin/bash

# Build script for Wepilot Chrome Extension
# Supports Chrome, Edge, and Brave browsers
# Usage: ./build.sh [browser] where browser can be chrome, edge, brave, or all (default)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine which browsers to build
BROWSER_ARG=${1:-all}
BROWSERS=()

case $BROWSER_ARG in
    "chrome")
        BROWSERS=("chrome")
        ;;
    "edge")
        BROWSERS=("edge")
        ;;
    "brave")
        BROWSERS=("brave")
        ;;
    "all"|"")
        BROWSERS=("chrome" "edge" "brave")
        ;;
    *)
        echo -e "${RED}❌ Invalid browser: $BROWSER_ARG${NC}"
        echo -e "${YELLOW}Usage: ./build.sh [chrome|edge|brave|all]${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 Building Wepilot Extension for: ${BROWSERS[*]}${NC}"

# Clean previous builds for selected browsers
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
for browser in "${BROWSERS[@]}"; do
    rm -rf "dist/$browser"
    mkdir -p "dist/$browser"
done

# Build TypeScript files
echo -e "${YELLOW}🔨 Building TypeScript files...${NC}"
npm run build

# Function to copy files for specific browser
copy_files() {
    local browser=$1
    local dest="dist/$browser"
    
    echo -e "${YELLOW}📦 Preparing $browser build...${NC}"
    
    # Create destination directory
    mkdir -p "$dest"
    
    # Copy all built files
    cp dist/*.js "$dest/"
    cp dist/*.html "$dest/"
    cp dist/manifest.json "$dest/"
    
    # Copy icons directory (PNG files are already copied by webpack)
    mkdir -p "$dest/icons"
    cp dist/icons/*.png "$dest/icons/"
    
    # Browser-specific manifest modifications
    case $browser in
        "edge")
            # Edge uses the same manifest as Chrome with Chromium extension support
            echo -e "${BLUE}  ⚡ Configuring for Microsoft Edge${NC}"
            ;;
        "brave")
            # Brave uses Chrome Web Store extensions
            echo -e "${BLUE}  🦁 Configuring for Brave Browser${NC}"
            ;;
        "chrome")
            echo -e "${BLUE}  🌐 Configuring for Google Chrome${NC}"
            ;;
    esac
}

# Build for selected browsers
for browser in "${BROWSERS[@]}"; do
    copy_files "$browser"
done

# Create ZIP packages for distribution
echo -e "${YELLOW}📮 Creating distribution packages...${NC}"
cd dist

for browser in "${BROWSERS[@]}"; do
    echo -e "  Creating $browser package..."
    cd "$browser"
    zip -r "../wepilot-$browser.zip" . > /dev/null
    cd ..
done

cd ..

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}📦 Packages created in dist/ directory:${NC}"
for browser in "${BROWSERS[@]}"; do
    case $browser in
        "chrome")
            echo -e "  • ${BLUE}wepilot-chrome.zip${NC} - For Chrome Web Store"
            ;;
        "edge")
            echo -e "  • ${BLUE}wepilot-edge.zip${NC} - For Microsoft Edge Add-ons"
            ;;
        "brave")
            echo -e "  • ${BLUE}wepilot-brave.zip${NC} - For Brave Browser (uses Chrome Web Store)"
            ;;
    esac
done

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "  1. Load unpacked extension from dist/chrome/ for testing"
echo -e "  2. Upload ZIP files to respective browser stores for publishing"
echo -e "  3. Test extension functionality in browser developer mode"
