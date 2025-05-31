#!/bin/bash

# Icon preparation script for Wepilot Extension
# Creates properly sized PNG icons from the source wepilot.png

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Preparing Wepilot Icons${NC}"

ICONS_DIR="public/icons"
SOURCE_ICON="$ICONS_DIR/wepilot.png"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo -e "${RED}❌ Source icon wepilot.png not found in $ICONS_DIR${NC}"
    echo -e "${YELLOW}Please ensure wepilot.png is in the public/icons/ directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found source icon: $SOURCE_ICON${NC}"

# Check if ImageMagick is available for resizing
if command -v convert &> /dev/null; then
    echo -e "${YELLOW}🔄 Using ImageMagick to resize icons...${NC}"
    
    # Generate all required icon sizes
    convert "$SOURCE_ICON" -resize 16x16 "$ICONS_DIR/icon16.png"
    convert "$SOURCE_ICON" -resize 32x32 "$ICONS_DIR/icon32.png" 
    convert "$SOURCE_ICON" -resize 48x48 "$ICONS_DIR/icon48.png"
    convert "$SOURCE_ICON" -resize 128x128 "$ICONS_DIR/icon128.png"
    
    echo -e "${GREEN}✅ Icons generated successfully!${NC}"
    
elif command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}🔄 Using FFmpeg to resize icons...${NC}"
    
    # Generate all required icon sizes using ffmpeg
    ffmpeg -i "$SOURCE_ICON" -vf scale=16:16 "$ICONS_DIR/icon16.png" -y > /dev/null 2>&1
    ffmpeg -i "$SOURCE_ICON" -vf scale=32:32 "$ICONS_DIR/icon32.png" -y > /dev/null 2>&1
    ffmpeg -i "$SOURCE_ICON" -vf scale=48:48 "$ICONS_DIR/icon48.png" -y > /dev/null 2>&1
    ffmpeg -i "$SOURCE_ICON" -vf scale=128:128 "$ICONS_DIR/icon128.png" -y > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Icons generated successfully!${NC}"
    
else
    echo -e "${YELLOW}⚠️  No image processing tools found.${NC}"
    echo -e "${BLUE}📝 Manual steps required:${NC}"
    echo -e "  1. Open public/icons/resize-icons.html in your browser"
    echo -e "  2. Download all four icon sizes (icon16.png, icon32.png, icon48.png, icon128.png)"
    echo -e "  3. Save them to the public/icons/ directory"
    echo ""
    echo -e "${YELLOW}Or install ImageMagick:${NC}"
    echo -e "  sudo apt-get install imagemagick"
    echo ""
    echo -e "${YELLOW}Or install FFmpeg:${NC}"
    echo -e "  sudo apt-get install ffmpeg"
    exit 1
fi

# List generated icons
echo -e "${BLUE}📦 Generated icon files:${NC}"
ls -la "$ICONS_DIR"/*.png 2>/dev/null || echo -e "${YELLOW}No PNG icons found${NC}"

echo -e "${GREEN}🎉 Icon preparation complete!${NC}"
