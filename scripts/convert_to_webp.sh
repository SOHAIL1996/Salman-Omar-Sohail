#!/bin/bash
# Script to convert PNG/JPG/GIF images to WebP format for better compression
# Requires: cwebp (from libwebp package) or ImageMagick
#
# Installation:
#   Ubuntu/Debian: sudo apt install webp
#   macOS: brew install webp
#   Or with ImageMagick: sudo apt install imagemagick

set -e

MEDIA_DIR="${1:-media}"
QUALITY="${2:-80}"  # WebP quality (0-100, higher is better quality)
DRY_RUN="${3:-false}"  # Set to "true" to preview without converting

echo "=== WebP Conversion Script ==="
echo "Directory: $MEDIA_DIR"
echo "Quality: $QUALITY"
echo "Dry run: $DRY_RUN"
echo ""

# Check for cwebp or convert command
if command -v cwebp &> /dev/null; then
    CONVERTER="cwebp"
    echo "Using: cwebp (libwebp)"
elif command -v convert &> /dev/null; then
    CONVERTER="imagemagick"
    echo "Using: ImageMagick convert"
else
    echo "Error: Neither cwebp nor ImageMagick found."
    echo "Install with: sudo apt install webp"
    exit 1
fi

echo ""

# Function to convert a single file
convert_file() {
    local input="$1"
    local output="${input%.*}.webp"

    # Skip if WebP already exists
    if [ -f "$output" ]; then
        echo "  SKIP (exists): $output"
        return 0
    fi

    local input_size=$(du -h "$input" | cut -f1)

    if [ "$DRY_RUN" = "true" ]; then
        echo "  WOULD CONVERT: $input ($input_size) -> $output"
        return 0
    fi

    if [ "$CONVERTER" = "cwebp" ]; then
        cwebp -q "$QUALITY" "$input" -o "$output" 2>/dev/null
    else
        convert "$input" -quality "$QUALITY" "$output" 2>/dev/null
    fi

    if [ -f "$output" ]; then
        local output_size=$(du -h "$output" | cut -f1)
        echo "  CONVERTED: $input ($input_size) -> $output ($output_size)"
    else
        echo "  FAILED: $input"
    fi
}

# Convert PNG files
echo "=== Converting PNG files ==="
find "$MEDIA_DIR" -type f -name "*.png" ! -name "*.drawio.png" | while read file; do
    convert_file "$file"
done

echo ""
echo "=== Converting JPG/JPEG files ==="
find "$MEDIA_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read file; do
    convert_file "$file"
done

echo ""
echo "=== Converting GIF files (animated GIFs may need gif2webp) ==="
if command -v gif2webp &> /dev/null; then
    find "$MEDIA_DIR" -type f -name "*.gif" | while read file; do
        output="${file%.gif}.webp"
        if [ -f "$output" ]; then
            echo "  SKIP (exists): $output"
            continue
        fi

        input_size=$(du -h "$file" | cut -f1)

        if [ "$DRY_RUN" = "true" ]; then
            echo "  WOULD CONVERT: $file ($input_size) -> $output"
            continue
        fi

        gif2webp -q "$QUALITY" "$file" -o "$output" 2>/dev/null

        if [ -f "$output" ]; then
            output_size=$(du -h "$output" | cut -f1)
            echo "  CONVERTED: $file ($input_size) -> $output ($output_size)"
        else
            echo "  FAILED: $file"
        fi
    done
else
    echo "  gif2webp not found. Install libwebp for animated GIF support."
    echo "  Skipping GIF conversion."
fi

echo ""
echo "=== Conversion Complete ==="
echo ""
echo "Next steps:"
echo "1. Review the converted files"
echo "2. Update HTML references from .png/.jpg/.gif to .webp"
echo "3. Remove original files once verified"
echo ""
echo "To update HTML references, you can use:"
echo '  sed -i "s/\.png\"/.webp\"/g" *.html'
echo '  sed -i "s/\.jpg\"/.webp\"/g" *.html'
