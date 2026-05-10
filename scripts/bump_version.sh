#!/usr/bin/env bash
# Bumps the cache-busting version across all HTML files and navbar.
# Usage: ./scripts/bump_version.sh 4.6
set -euo pipefail

NEW="${1:?Usage: $0 <new-version>  e.g.  $0 4.6}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Sanity: must look like X.Y or X.Y.Z
[[ "$NEW" =~ ^[0-9]+(\.[0-9]+){1,2}$ ]] || { echo "Bad version: $NEW"; exit 1; }

HTML_FILES=(index.html experience.html projects.html academia.html rubric.html robot_deployment.html)

for f in "${HTML_FILES[@]}"; do
    # Replace existing ?v=X on css_common.css
    sed -i -E "s|(href=\"css_common\.css)\?v=[^\"]+\"|\1?v=${NEW}\"|g" "$f"
    # Replace existing ?v=X on local javascripts
    sed -i -E "s|(src=\"javascripts/[^\"?]+\\.js)\?v=[^\"]+\"|\1?v=${NEW}\"|g" "$f"
done

# Update the navbar version label
sed -i -E "s|<span class=\"version\">[[:space:]]*v[0-9]+(\.[0-9]+){1,2}[[:space:]]*</span>|<span class=\"version\"> v${NEW} </span>|" navbar.html

echo "Bumped to v${NEW}."
echo "Files touched:"
git diff --stat -- "${HTML_FILES[@]}" navbar.html | tail -n +1
