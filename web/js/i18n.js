// Internacionalización — ES/EN

const TRANSLATIONS = {
    es: {
        pageTitle: 'Imagen a Base64 | Kromativo',
        heroTitleHtml: 'Imagen a <span class="accent">Base64</span>',
        subtitle: 'Convierte tus imágenes a Base64 con 3 niveles de compresión y descarga todo en un solo ZIP.',
        dropzoneTextHtml: 'Arrastra tus imágenes o <span class="dropzone-link">selecciona archivos</span>',
        dropzoneHint: 'JPG, PNG, WEBP, GIF, AVIF +más · máx. 10 archivos, 50MB c/u',
        privacyNote: '🔒 Todo ocurre en tu navegador — nunca guardamos tus archivos',
        convert: 'Convertir',
        converting: (i, n) => `Convirtiendo ${i}/${n}...`,
        generatingZip: 'Generando ZIP...',
        resultsTitleHtml: 'Tus imágenes están <span class="accent">listas</span>',
        resultsSubtitle: 'Descarga todo en un ZIP, o elige un solo nivel por imagen.',
        downloadAll: 'Descargar todo (ZIP)',
        loadOthers: 'Cargar otras imágenes',
        original: 'original',
        compressed: (r) => `${r}% comprimido`,
        heavier: (r) => `+${r}% más pesado`,
        noChange: 'Sin cambio de peso',
        codeLines: (n) => `~${n} líneas de código`,
        viewLabel: (level) => `Ver ${level}`,
        downloadLabel: (level) => `Descargar ${level}`,
        removeLabel: (name) => `Quitar ${name}`,
        errInvalidFormat: (name) => `"${name}" no es un formato válido — se omitió.`,
        errTooLarge: (name) => `"${name}" supera el límite de 50MB — se omitió.`,
        errMaxFiles: (max) => `Límite de ${max} archivos a la vez alcanzado.`,
        errMaxTotal: (max) => `El peso combinado supera ${max}.`,
        errRaw: (name) => `"${name}" es un formato RAW de cámara — los navegadores no pueden procesarlo. Expórtalo a JPG/PNG primero.`,
        errFormatFallback: (name, ext) => `"${name}" no pudo conservarse en su formato original (tu navegador no lo soporta) — se convirtió a ${ext}.`,
        errFileFailed: (name) => `"${name}" no se pudo procesar — se omitió.`,
        errTooBigDims: (name) => `"${name}" tiene dimensiones demasiado grandes para procesarse de forma segura — se omitió.`,
        errNotRealImage: (name) => `"${name}" no es una imagen válida (el contenido no coincide con el formato declarado) — se omitió.`,
        errGenericDownload: 'No se pudo generar la descarga. Intenta de nuevo.',
        errGenericZip: 'No se pudo generar el ZIP. Intenta de nuevo.',
        dismissAlert: 'Cerrar alerta',
        footerNote: 'Creado por Kromativo · Proyecto construido con asistencia de inteligencia artificial.',
        footerCopyright: '© 2026 Kromativo',
        footerLicense: 'Licencia MIT',
    },
    en: {
        pageTitle: 'Image to Base64 | Kromativo',
        heroTitleHtml: 'Image to <span class="accent">Base64</span>',
        subtitle: 'Convert your images to Base64 with 3 compression levels and download everything in a single ZIP.',
        dropzoneTextHtml: 'Drag your images or <span class="dropzone-link">choose files</span>',
        dropzoneHint: 'JPG, PNG, WEBP, GIF, AVIF +more · max. 10 files, 50MB each',
        privacyNote: '🔒 Everything happens in your browser — we never store your files',
        convert: 'Convert',
        converting: (i, n) => `Converting ${i}/${n}...`,
        generatingZip: 'Generating ZIP...',
        resultsTitleHtml: 'Your images are <span class="accent">ready</span>',
        resultsSubtitle: 'Download everything as one ZIP, or pick a single level per image.',
        downloadAll: 'Download all (ZIP)',
        loadOthers: 'Load other images',
        original: 'original',
        compressed: (r) => `${r}% compressed`,
        heavier: (r) => `+${r}% heavier`,
        noChange: 'No size change',
        codeLines: (n) => `~${n} lines of code`,
        viewLabel: (level) => `View ${level}`,
        downloadLabel: (level) => `Download ${level}`,
        removeLabel: (name) => `Remove ${name}`,
        errInvalidFormat: (name) => `"${name}" is not a valid format — skipped.`,
        errTooLarge: (name) => `"${name}" exceeds the 50MB limit — skipped.`,
        errMaxFiles: (max) => `Limit of ${max} files at a time reached.`,
        errMaxTotal: (max) => `Combined size exceeds ${max}.`,
        errRaw: (name) => `"${name}" is a camera RAW format — browsers can't process it. Export it to JPG/PNG first.`,
        errFormatFallback: (name, ext) => `"${name}" could not be kept in its original format (your browser doesn't support it) — converted to ${ext}.`,
        errFileFailed: (name) => `"${name}" could not be processed — skipped.`,
        errTooBigDims: (name) => `"${name}" has dimensions too large to process safely — skipped.`,
        errNotRealImage: (name) => `"${name}" is not a valid image (content doesn't match the declared format) — skipped.`,
        errGenericDownload: 'Could not generate the download. Try again.',
        errGenericZip: 'Could not generate the ZIP. Try again.',
        dismissAlert: 'Dismiss alert',
        footerNote: 'Made by Kromativo · Project built with AI assistance.',
        footerCopyright: '© 2026 Kromativo',
        footerLicense: 'MIT License',
    },
};

let currentLang = 'es';

function t(key, ...args) {
    const entry = TRANSLATIONS[currentLang][key] ?? TRANSLATIONS.es[key];
    return typeof entry === 'function' ? entry(...args) : entry;
}

function detectLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function applyStaticTranslations() {
    document.title = t('pageTitle');
    document.documentElement.setAttribute('lang', currentLang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyStaticTranslations();
    if (typeof onLanguageChange === 'function') onLanguageChange();
}
