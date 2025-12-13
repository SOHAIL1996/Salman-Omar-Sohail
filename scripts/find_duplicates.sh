#!/bin/bash
# Script to find duplicate image files (same base name with different extensions)
# This helps identify redundant files that can be removed

echo "=== Finding Duplicate Image Files ==="
echo ""

MEDIA_DIR="${1:-media}"

# Check if the directory exists
if [ ! -d "$MEDIA_DIR" ]; then
    echo "Error: Directory '$MEDIA_DIR' not found"
    exit 1
fi

echo "Scanning directory: $MEDIA_DIR"
echo ""

# Find files with same base name but different extensions
echo "=== PNG files that also have WebP versions (can remove PNG) ==="
find "$MEDIA_DIR" -type f -name "*.png" | while read png_file; do
    base="${png_file%.png}"
    if [ -f "${base}.webp" ]; then
        png_size=$(du -h "$png_file" | cut -f1)
        webp_size=$(du -h "${base}.webp" | cut -f1)
        echo "  PNG: $png_file ($png_size) -> WebP exists ($webp_size)"
    fi
done

echo ""
echo "=== GIF files that also have WebP versions (can remove GIF) ==="
find "$MEDIA_DIR" -type f -name "*.gif" | while read gif_file; do
    base="${gif_file%.gif}"
    if [ -f "${base}.webp" ]; then
        gif_size=$(du -h "$gif_file" | cut -f1)
        webp_size=$(du -h "${base}.webp" | cut -f1)
        echo "  GIF: $gif_file ($gif_size) -> WebP exists ($webp_size)"
    fi
done

echo ""
echo "=== DrawIO source files with exported images ==="
find "$MEDIA_DIR" -type f -name "*.drawio" | while read drawio_file; do
    base="${drawio_file%.drawio}"
    found=""
    if [ -f "${base}.drawio.png" ]; then
        found="${found} PNG"
    fi
    if [ -f "${base}.drawio.webp" ]; then
        found="${found} WebP"
    fi
    if [ -n "$found" ]; then
        echo "  DrawIO: $drawio_file -> Has exports:$found"
    fi
done

echo ""
echo "=== Large files (>5MB) that could be optimized ==="
find "$MEDIA_DIR" -type f \( -name "*.png" -o -name "*.gif" -o -name "*.jpg" -o -name "*.jpeg" \) -size +5M | while read large_file; do
    size=$(du -h "$large_file" | cut -f1)
    echo "  $large_file ($size)"
done

echo ""
echo "=== Summary ==="
total_size=$(du -sh "$MEDIA_DIR" 2>/dev/null | cut -f1)
echo "Total media folder size: $total_size"

png_count=$(find "$MEDIA_DIR" -type f -name "*.png" | wc -l)
webp_count=$(find "$MEDIA_DIR" -type f -name "*.webp" | wc -l)
gif_count=$(find "$MEDIA_DIR" -type f -name "*.gif" | wc -l)
jpg_count=$(find "$MEDIA_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | wc -l)

echo "PNG files: $png_count"
echo "WebP files: $webp_count"
echo "GIF files: $gif_count"
echo "JPG/JPEG files: $jpg_count"
