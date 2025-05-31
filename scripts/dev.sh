#!/bin/bash

# Development script for Wepilot Extension
# Builds in watch mode and provides development utilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  Wepilot Development Mode${NC}"

# Function to display help
show_help() {
    echo -e "${YELLOW}Usage: $0 [OPTION]${NC}"
    echo -e "Development utilities for Wepilot extension"
    echo ""
    echo -e "Options:"
    echo -e "  ${GREEN}build${NC}      Build the extension once"
    echo -e "  ${GREEN}watch${NC}      Build and watch for changes"
    echo -e "  ${GREEN}clean${NC}      Clean build directories"
    echo -e "  ${GREEN}test${NC}       Run tests (if available)"
    echo -e "  ${GREEN}lint${NC}       Run linting checks"
    echo -e "  ${GREEN}serve${NC}      Serve extension for testing"
    echo -e "  ${GREEN}help${NC}       Show this help message"
}

# Function to clean build directories
clean_build() {
    echo -e "${YELLOW}🧹 Cleaning build directories...${NC}"
    rm -rf build/ dist/
    echo -e "${GREEN}✅ Clean complete${NC}"
}

# Function to build extension
build_extension() {
    echo -e "${YELLOW}🔨 Building extension...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Function to watch for changes
watch_extension() {
    echo -e "${YELLOW}👀 Watching for changes...${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop watching${NC}"
    npm run build:watch
}

# Function to run linting
lint_code() {
    echo -e "${YELLOW}🔍 Running linting checks...${NC}"
    if command -v npx eslint &> /dev/null; then
        npx eslint src/ --ext .ts,.js
    else
        echo -e "${YELLOW}⚠️  ESLint not installed. Skipping...${NC}"
    fi
}

# Function to serve extension for testing
serve_extension() {
    echo -e "${YELLOW}🌐 Setting up development environment...${NC}"
    build_extension
    
    echo -e "${GREEN}✅ Development build ready!${NC}"
    echo -e "${BLUE}📂 Load unpacked extension from: $(pwd)/build${NC}"
    echo -e "${YELLOW}Instructions:${NC}"
    echo -e "  1. Open Chrome and go to chrome://extensions/"
    echo -e "  2. Enable 'Developer mode' (top right toggle)"
    echo -e "  3. Click 'Load unpacked' and select the build/ directory"
    echo -e "  4. The extension should now be loaded and ready for testing"
    echo ""
    echo -e "${BLUE}🔧 For live reloading, use 'npm run dev:watch' in another terminal${NC}"
}

# Main script logic
case "${1:-help}" in
    "build")
        build_extension
        ;;
    "watch")
        watch_extension
        ;;
    "clean")
        clean_build
        ;;
    "test")
        echo -e "${YELLOW}🧪 Running tests...${NC}"
        echo -e "${BLUE}No tests configured yet. Add Jest or your preferred testing framework.${NC}"
        ;;
    "lint")
        lint_code
        ;;
    "serve")
        serve_extension
        ;;
    "help"|*)
        show_help
        ;;
esac
