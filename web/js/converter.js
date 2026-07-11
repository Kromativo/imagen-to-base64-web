// Image to Base64 conversion logic — 100% client-side, nada sale del navegador

// scale = porcentaje del tamaño ORIGINAL (no píxeles fijos). Así el
// comportamiento es proporcional sin importar si la imagen es una
// captura de 800px o una foto de cámara de 6000px.
const PRESETS = {
    light: { quality: 0.92, scale: 1, label: 'Light' },
    medium: { quality: 0.68, scale: 0.95, label: 'Medium' },
    heavy: { quality: 0.45, scale: 0.75, label: 'Heavy' },
};

function sanitizeBaseName(filename) {
    const base = filename.replace(/\.[^/.]+$/, '');
    return base.replace(/[^a-zA-Z0-9_-]/g, '_') || 'imagen';
}

function loadImageElement(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ img, url });
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`No se pudo leer "${file.name}"`));
        };
        img.src = url;
    });
}

function extForMime(mimeType) {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
}

function compressToBlob(img, { quality, scale, mimeType }) {
    return new Promise((resolve, reject) => {
        const targetWidth = Math.round(img.naturalWidth * scale);
        const targetHeight = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Fallo al comprimir la imagen'));
                    return;
                }
                resolve({ blob, width: targetWidth, height: targetHeight });
            },
            mimeType,
            mimeType === 'image/png' ? undefined : quality
        );
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Fallo al codificar a Base64'));
        reader.readAsDataURL(blob);
    });
}

function formatBytesPrecise(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function processFile(file) {
    const { img, url } = await loadImageElement(file);

    try {
        // Pedimos siempre el formato original. Si el navegador no puede
        // re-codificarlo (GIF, AVIF, etc.), cae automáticamente a PNG —
        // en ese caso lo detectamos y lo avisamos, no lo escondemos.
        const requestedMime = file.type;
        const baseName = sanitizeBaseName(file.name);

        const presetResults = {};
        let outputMime = requestedMime;

        for (const [key, preset] of Object.entries(PRESETS)) {
            const wasResized = preset.scale < 1;
            let { blob, width, height } = await compressToBlob(img, {
                quality: preset.quality,
                scale: preset.scale,
                mimeType: requestedMime,
            });

            // Re-codificar sin cambiar dimensiones a veces pesa más que el
            // original (el encoder PNG del navegador no optimiza tan bien
            // como herramientas dedicadas). Si no hubo resize y el resultado
            // quedó más pesado, nos quedamos con el original — nunca inflamos.
            if (!wasResized && blob.size >= file.size) {
                blob = file;
                width = img.naturalWidth;
                height = img.naturalHeight;
            }

            outputMime = blob.type || outputMime;
            const base64 = await blobToBase64(blob);
            const ratio = ((file.size - blob.size) / file.size) * 100;

            presetResults[key] = {
                blob,
                base64,
                dataUri: `data:${blob.type};base64,${base64}`,
                width,
                height,
                size: blob.size,
                sizeFmt: formatBytesPrecise(blob.size),
                ratio,
                base64Length: base64.length,
            };
        }

        const ext = extForMime(outputMime);
        const formatPreserved = outputMime === requestedMime;

        const metadata = {
            filename: file.name,
            mime_type: outputMime,
            original_size_bytes: file.size,
            original_size: formatBytesPrecise(file.size),
            original_dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            presets: Object.fromEntries(
                Object.entries(presetResults).map(([key, r]) => [
                    key,
                    {
                        quality: PRESETS[key].quality,
                        scale: PRESETS[key].scale,
                        compressed_size_bytes: r.size,
                        compressed_size: r.sizeFmt,
                        compression_ratio: `${r.ratio.toFixed(1)}%`,
                        dimensions: { width: r.width, height: r.height },
                        base64_length: r.base64Length,
                    },
                ])
            ),
        };

        return {
            originalFile: file,
            baseName,
            ext,
            mimeType: outputMime,
            formatPreserved,
            originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
            presets: presetResults,
            metadata,
        };
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function buildZip(processedList) {
    const zip = new JSZip();

    processedList.forEach((item) => {
        const folder = zip.folder(item.baseName);
        folder.file(item.originalFile.name, item.originalFile);

        Object.entries(item.presets).forEach(([key, preset]) => {
            folder.file(`${item.baseName}_base64_${key}.txt`, preset.base64);
            folder.file(`${item.baseName}_${key}${item.ext}`, preset.blob);
        });

        folder.file(`${item.baseName}_metadata.json`, JSON.stringify(item.metadata, null, 2));
    });

    return zip.generateAsync({ type: 'blob' });
}

async function buildMicroZip(item, presetKey) {
    const zip = new JSZip();
    const preset = item.presets[presetKey];
    zip.file(`${item.baseName}_${presetKey}${item.ext}`, preset.blob);
    zip.file(`${item.baseName}_base64_${presetKey}.txt`, preset.base64);
    return zip.generateAsync({ type: 'blob' });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
