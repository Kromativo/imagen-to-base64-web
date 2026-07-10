# imagen-to-base64-web

Zero-knowledge image to base64 converter with ZIP export. 100% client-side processing — your data never touches our servers.

## Features

- Convert images to Base64 (client-side only)
- 3 compression levels (light, medium, heavy)
- Download organized ZIP with all variants
- Copy to clipboard (Base64, Data URI, HTML tag)
- Zero data persistence — truly private
- Lightweight, no dependencies

## Privacy Promise

- **No server storage:** files processed in RAM only
- **No logging of image data:** only anonymized metrics
- **No cookies/tracking:** pure static HTML + vanilla JS
- **Source code open:** verify security yourself on GitHub

## Demo

[Live at imagen-to-base64.vercel.app](https://imagen-to-base64.vercel.app) (coming soon)

## How to Use

1. Visit the live site
2. Upload an image (JPG/PNG)
3. Click "Convert"
4. Download ZIP with all compression levels
5. Or copy Base64 directly to clipboard

## Local Setup

```bash
git clone https://github.com/Kromativo/imagen-to-base64-web.git
cd imagen-to-base64-web
python3 -m http.server 8000 --directory web
# Open http://localhost:8000
```

## License

MIT © 2026 Richard Diaz | Kromativo

## Contact

- Email: kromativo@gmail.com
- Web: https://kromativo.com
