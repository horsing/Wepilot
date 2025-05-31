#!/bin/bash

# Validation script for Wepilot Extension
# Checks that all required files are present and properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Wepilot Extension Validation${NC}"

ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ Missing: $description ($file)${NC}"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ Missing: $description ($dir)${NC}"
        ((ERRORS++))
    fi
}

# Function to validate JSON
check_json() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            echo -e "${GREEN}✅ $description (valid JSON)${NC}"
        else
            echo -e "${RED}❌ $description (invalid JSON)${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${RED}❌ Missing: $description${NC}"
        ((ERRORS++))
    fi
}

echo -e "${YELLOW}📋 Checking project structure...${NC}"

# Check main project files
check_file "package.json" "Package configuration"
check_file "tsconfig.json" "TypeScript configuration"
check_file "webpack.config.js" "Webpack configuration"
check_file "README.md" "Documentation"
check_file "LICENSE" "License file"
check_file ".gitignore" "Git ignore file"

echo -e "\n${YELLOW}📦 Checking source files...${NC}"

# Check source directories
check_dir "src" "Source directory"
check_dir "src/background" "Background script directory"
check_dir "src/content" "Content script directory"
check_dir "src/popup" "Popup directory"
check_dir "src/sidebar" "Sidebar directory"
check_dir "src/options" "Options directory"
check_dir "src/utils" "Utilities directory"
check_dir "src/types" "TypeScript types directory"

# Check source files
check_file "src/background/background.ts" "Background service worker"
check_file "src/content/content.ts" "Content script"
check_file "src/popup/popup.ts" "Popup script"
check_file "src/popup/popup.css" "Popup styles"
check_file "src/sidebar/sidebar.ts" "Sidebar script"
check_file "src/sidebar/sidebar.css" "Sidebar styles"
check_file "src/options/options.ts" "Options script"
check_file "src/options/options.css" "Options styles"
check_file "src/types/index.ts" "Type definitions"
check_file "src/utils/domUtils.ts" "DOM utilities"
check_file "src/utils/aiService.ts" "AI service"

echo -e "\n${YELLOW}🌐 Checking public files...${NC}"

# Check public files
check_dir "public" "Public directory"
check_json "public/manifest.json" "Extension manifest"
check_file "public/popup.html" "Popup HTML"
check_file "public/sidebar.html" "Sidebar HTML"
check_file "public/options.html" "Options HTML"

echo -e "\n${YELLOW}🎨 Checking icons...${NC}"

# Check icons
check_dir "public/icons" "Icons directory"
check_file "public/icons/wepilot.png" "Source icon (wepilot.png)"
check_file "public/icons/icon16.png" "16px icon"
check_file "public/icons/icon32.png" "32px icon"
check_file "public/icons/icon48.png" "48px icon"
check_file "public/icons/icon128.png" "128px icon"

echo -e "\n${YELLOW}🏗️  Checking build outputs...${NC}"

# Check if built
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Build directory exists${NC}"
    
    # Check main build files
    check_file "dist/manifest.json" "Built manifest"
    check_file "dist/background.js" "Built background script"
    check_file "dist/content.js" "Built content script"
    check_file "dist/popup.js" "Built popup script"
    check_file "dist/sidebar.js" "Built sidebar script"
    check_file "dist/options.js" "Built options script"
    
    # Check HTML files
    check_file "dist/popup.html" "Built popup HTML"
    check_file "dist/sidebar.html" "Built sidebar HTML"
    check_file "dist/options.html" "Built options HTML"
    
    # Check browser packages
    check_dir "dist/chrome" "Chrome build directory"
    check_dir "dist/edge" "Edge build directory"
    check_dir "dist/brave" "Brave build directory"
    
    # Check ZIP packages
    check_file "dist/wepilot-chrome.zip" "Chrome package"
    check_file "dist/wepilot-edge.zip" "Edge package"
    check_file "dist/wepilot-brave.zip" "Brave package"
    
else
    echo -e "${YELLOW}⚠️  Build directory not found. Run 'npm run build' first.${NC}"
    ((WARNINGS++))
fi

echo -e "\n${YELLOW}🔧 Checking development tools...${NC}"

# Check scripts
check_dir "scripts" "Scripts directory"
check_file "scripts/build.sh" "Build script"
check_file "scripts/dev.sh" "Development script"
check_file "scripts/prepare-icons.sh" "Icon preparation script"

# Check if scripts are executable
if [ -x "scripts/build.sh" ]; then
    echo -e "${GREEN}✅ Build script is executable${NC}"
else
    echo -e "${YELLOW}⚠️  Build script is not executable${NC}"
    ((WARNINGS++))
fi

if [ -x "scripts/dev.sh" ]; then
    echo -e "${GREEN}✅ Development script is executable${NC}"
else
    echo -e "${YELLOW}⚠️  Development script is not executable${NC}"
    ((WARNINGS++))
fi

echo -e "\n${YELLOW}📋 Checking package.json scripts...${NC}"

# Check if required npm scripts exist
if node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log(JSON.stringify(pkg.scripts, null, 2))" | grep -q "build"; then
    echo -e "${GREEN}✅ Build script defined${NC}"
else
    echo -e "${RED}❌ Build script not defined${NC}"
    ((ERRORS++))
fi

# Summary
echo -e "\n${BLUE}📊 Validation Summary${NC}"
echo -e "===================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! The extension is ready for use.${NC}"
    echo -e "\n${BLUE}🚀 Next steps:${NC}"
    echo -e "  1. Load the extension in Chrome: chrome://extensions/"
    echo -e "  2. Enable Developer mode"
    echo -e "  3. Click 'Load unpacked' and select the dist/chrome/ directory"
    echo -e "  4. Test the extension functionality"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with $WARNINGS warning(s).${NC}"
    echo -e "The extension should work, but consider addressing the warnings."
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo -e "Please fix the errors before proceeding."
    exit 1
fi

exit 0
