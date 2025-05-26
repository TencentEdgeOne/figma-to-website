#!/bin/bash

echo "Building Figma plugin..."
npm run build

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
ZIP_NAME="figma-to-website-plugin.zip"

echo "Creating Figma plugin package..."

# Copy the manifest.json
cp manifest.json $TEMP_DIR/

# Create the directory structure matching the paths in manifest.json
mkdir -p $TEMP_DIR/apps/plugin/dist

# Copy the plugin files to the correct path
cp apps/plugin/dist/code.js $TEMP_DIR/apps/plugin/dist/
cp apps/plugin/dist/index.html $TEMP_DIR/apps/plugin/dist/

# Create the ZIP file
cd $TEMP_DIR
zip -r ../$ZIP_NAME .
cd - > /dev/null

# Move the ZIP to the current directory
mv $TEMP_DIR/../$ZIP_NAME .

# Clean up
rm -rf $TEMP_DIR

echo "Package created: $ZIP_NAME"
echo "You can now import this ZIP file into Figma as a plugin." 