# ExifBorder

Client-side image framing tool. Upload JPEG images, configure borders with EXIF metadata text overlays, add logos, and batch-render the output — all in the browser. No server required.

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. Drop images, configure borders and text, download rendered results.

## How it works

Everything runs in the browser via the Canvas API:

- **EXIF reading** — [exifr](https://github.com/MikeKovarik/exifr) parses metadata from JPEG files
- **Rendering** — Canvas 2D API handles borders, text overlays, logo placement, and EXIF orientation correction
- **ZIP export** — [JSZip](https://stuk.github.io/jszip/) bundles rendered images client-side
- **Persistence** — config and theme saved to `localStorage`

RAW image formats (ARW, etc.) are not supported — browsers have no native RAW decoder.

## Deploy

Static files only. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

### Vercel

```bash
vercel
```

The included `vercel.json` handles SPA fallback routing.

## Directory layout

```
exifborder/
├── index.html               # Single-page app (hash-based routing)
├── vercel.json              # Vercel static deploy config
├── package.json
├── static/
│   ├── css/
│   │   └── style.css        # Theme variables + component styles
│   ├── js/
│   │   ├── app-state.js     # Central state, navigation, localStorage
│   │   ├── border.js        # Border dimension math
│   │   ├── exif-reader.js   # EXIF parsing wrapper
│   │   ├── image-renderer.js # Canvas rendering pipeline
│   │   ├── step1-files.js   # File upload & EXIF display
│   │   ├── step2-layout.js  # Border/text/logo configuration
│   │   └── step3-review.js  # Batch render & download
│   └── logos/
│       └── Sony_Alpha_logo.svg
```

## Theme

Light and dark themes included. Toggle via the ☀️/🌙 button in the header. Theme persists across reloads and respects `prefers-color-scheme` on first visit.
