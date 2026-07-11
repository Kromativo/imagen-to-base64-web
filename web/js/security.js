// Security validations — todo corre en el navegador, nada se envía a ningún servidor

// Máximo de píxeles totales (ancho × alto) que procesamos. Evita que una
// imagen con dimensiones absurdas (real o manipulada) cuelgue el navegador
// al dibujarla en <canvas> (equivalente a una "decompression bomb").
const MAX_PIXELS = 60_000_000; // ~60 megapíxeles (ej. 10000x6000)

// Firmas binarias ("magic bytes") de los formatos de imagen reales más
// comunes. Comparamos esto contra el contenido real del archivo — no
// contra su extensión ni su `file.type` — para detectar archivos
// disfrazados de imagen (ej. un .exe renombrado a .jpg).
const SIGNATURES = [
    { bytes: [0xFF, 0xD8, 0xFF], offset: 0 }, // JPEG
    { bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0 }, // PNG
    { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 }, // GIF87a/GIF89a
    { bytes: [0x42, 0x4D], offset: 0 }, // BMP
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, andBytesAt: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] } }, // WEBP (RIFF....WEBP)
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // AVIF/HEIC (ftyp box)
];

function readHeaderBytes(file, length = 16) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsArrayBuffer(file.slice(0, length));
    });
}

function matchesSignature(bytes, sig) {
    for (let i = 0; i < sig.bytes.length; i++) {
        if (bytes[sig.offset + i] !== sig.bytes[i]) return false;
    }
    if (sig.andBytesAt) {
        for (let i = 0; i < sig.andBytesAt.bytes.length; i++) {
            if (bytes[sig.andBytesAt.offset + i] !== sig.andBytesAt.bytes[i]) return false;
        }
    }
    return true;
}

async function hasRealImageSignature(file) {
    const bytes = await readHeaderBytes(file);
    return SIGNATURES.some((sig) => matchesSignature(bytes, sig));
}

function exceedsMaxPixels(width, height) {
    return width * height > MAX_PIXELS;
}
