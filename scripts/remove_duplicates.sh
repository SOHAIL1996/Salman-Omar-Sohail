#!/bin/bash
# Remove duplicate PNG and GIF files that have WebP versions

MEDIA_DIR="${1:-media}"
echo "=== Removing duplicate files in $MEDIA_DIR ==="
echo ""

# Remove PNG files with WebP versions
echo "Removing PNG files with WebP versions..."
for png_file in $(find "$MEDIA_DIR" -type f -name "*.png"); do
    base="${png_file%.png}"
    if [ -f "${base}.webp" ]; then
        echo "  Removing: $png_file"
        rm "$png_file"
    fi
done

echo ""
echo "Removing GIF files with WebP versions..."
for gif_file in $(find "$MEDIA_DIR" -type f -name "*.gif"); do
    base="${gif_file%.gif}"
    if [ -f "${base}.webp" ]; then
        echo "  Removing: $gif_file"
        rm "$gif_file"
    fi
done

echo ""
echo "Done!"
