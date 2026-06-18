# ExifBorder

Client-side image framing tool. Upload JPEG images, configure borders with EXIF metadata text overlays, add logos, and batch-render the output — all in the browser. No server required.

**Live at [border-exif.vercel.app](https://border-exif.vercel.app)** — [Open App](https://border-exif.vercel.app/app)

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. The landing page introduces the tool; click **Open App** or **Upload & Frame** to enter the 3-step wizard.

## How it works

Everything runs in the browser via the Canvas API:

- **EXIF reading** — [exifr](https://github.com/MikeKovarik/exifr) parses metadata from JPEG files
- **Rendering** — Canvas 2D API handles borders, text overlays, logo placement, and EXIF orientation correction
- **ZIP export** — [JSZip](https://stuk.github.io/jszip/) bundles rendered images client-side
- **Animations** — [GSAP](https://gsap.com) + ScrollTrigger for scroll-driven effects, 3D tilt, and micro-interactions
- **Persistence** — config and theme saved to `localStorage`

RAW image formats (ARW, etc.) are not supported — browsers have no native RAW decoder.

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `index.html` | Landing page with animated hero, trust stats, workflow cards, and CTA |
| `/app` | `app.html` | 3-step wizard: select files → configure borders & text → review & download |

The landing page and app share the same theme system (`exifborder-theme` key in `localStorage`).

## Deploy

Static files only. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

### Vercel

Deployed at [border-exif.vercel.app](https://border-exif.vercel.app). The included `vercel.json` configures static file serving and SPA-style rewrites.

```bash
vercel
```

## Directory layout

```
exifborder/
├── index.html                # Landing page
├── app.html                  # 3-step image framing app
├── vercel.json               # Vercel static deploy config
├── package.json
├── static/
│   ├── css/
│   │   ├── landing.css       # Landing page styles (theme tokens, hero, cards, cursor)
│   │   └── style.css         # App styles (theme variables, form controls, tables)
│   ├── js/
│   │   ├── landing.js        # GSAP animations, particles, cursor, 3D tilt, shockwave
│   │   ├── app-state.js      # Central state, navigation, localStorage
│   │   ├── border.js         # Border dimension math
│   │   ├── exif-reader.js    # EXIF parsing wrapper
│   │   ├── image-renderer.js # Canvas rendering pipeline
│   │   ├── step1-files.js    # File upload & EXIF display
│   │   ├── step2-layout.js   # Border/text/logo configuration
│   │   └── step3-review.js   # Batch render & download
│   └── logos/
│       └── Sony_Alpha_logo.svg
```

## Theme

Light and dark themes included. Toggle via the ☀️/🌙 button in the header. Theme persists across reloads, navigates between landing and app, and respects `prefers-color-scheme` on first visit.
