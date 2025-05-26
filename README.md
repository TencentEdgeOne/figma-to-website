# Figma to Website

A Figma plugin that transforms your designs into ready-to-deploy website code and provides one-click publishing with instant online access.

![](https://cdnstatic.tencentcs.com/edgeone/pages/assets/KdwED-1747829976700.gif)

## Features

- Convert Figma designs to HTML code with a single click
- One-click publishing to web
- Open source and customizable

## Getting Started

1. Install the plugin from the Figma Plugin Store
2. Select the frames or components you want to convert
3. Run the plugin and generate your website code
4. Publish directly to the web or export the code for further customization

## Technology

The plugin generates clean, responsive HTML/CSS code that accurately reflects your Figma design, preserving layout, styling, and interactions.

## Project Structure

The project is organized as a monorepo with multiple packages:

- `plugin-ui`: React components for the plugin interface
- Additional packages for code generation and publishing functionality

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Credits

This plugin is based on the open-source [Figma to Code](https://github.com/bernaferrari/figmatocode) project by Bernardo Ferrari and is powered by [EdgeOne Pages](https://edgeone.ai/products/pages).
