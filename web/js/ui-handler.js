// UI interactions & event listeners

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB por archivo
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 300 * 1024 * 1024; // 300MB combinado

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('file-list');
const fileProgressEl = document.getElementById('file-progress');
const fileProgressFillEl = document.getElementById('file-progress-fill');
const fileProgressCountEl = document.getElementById('file-progress-count');
const errorListEl = document.getElementById('error-list');
const btnConvert = document.getElementById('btn-convert');
const dropOverlay = document.getElementById('drop-overlay');
const uploadContainer = document.querySelector('.upload-container');
const resultsContainer = document.getElementById('results-container');
const resultCardsEl = document.getElementById('result-cards');
const btnDownloadAll = document.getElementById('btn-download-all');
const btnBack = document.getElementById('btn-back');
const previewModal = document.getElementById('preview-modal');
const previewModalBackdrop = document.getElementById('preview-modal-backdrop');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const modalLevelBadge = document.getElementById('modal-level-badge');
const modalClose = document.getElementById('modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');

const PRESET_ORDER = ['light', 'medium', 'heavy'];

let selectedFiles = []; // Array<File>
let processedResults = []; // Array<processFile() output>
let modalItemIndex = 0;
let modalPresetIndex = 0;
let activeThumbUrls = [];

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showError(message) {
    const item = document.createElement('div');
    item.className = 'error-item';
    item.innerHTML = `
        <span>${message}</span>
        <button class="error-item-dismiss" type="button" aria-label="${t('dismissAlert')}">✕</button>
    `;
    item.querySelector('.error-item-dismiss').addEventListener('click', () => item.remove());
    errorListEl.appendChild(item);
}

function clearErrors() {
    errorListEl.innerHTML = '';
}

function totalSize() {
    return selectedFiles.reduce((sum, f) => sum + f.size, 0);
}

function displayFileName(name) {
    const isMobile = window.matchMedia('(max-width: 480px)').matches;
    if (!isMobile || name.length <= 26) return name;
    return name.slice(0, 14) + '…' + name.slice(-10);
}

function renderFileList() {
    activeThumbUrls.forEach((url) => URL.revokeObjectURL(url));
    activeThumbUrls = [];
    fileListEl.innerHTML = '';

    fileProgressFillEl.style.width = (selectedFiles.length / MAX_FILES * 100) + '%';
    fileProgressCountEl.textContent = `${selectedFiles.length}/${MAX_FILES}`;
    dropzone.hidden = selectedFiles.length >= MAX_FILES;

    if (selectedFiles.length === 0) {
        fileListEl.hidden = true;
        fileProgressEl.hidden = true;
        btnConvert.disabled = true;
        return;
    }

    fileListEl.hidden = false;
    fileProgressEl.hidden = false;
    btnConvert.disabled = false;

    selectedFiles.forEach((file, index) => {
        const thumbUrl = URL.createObjectURL(file);
        activeThumbUrls.push(thumbUrl);

        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <img class="file-item-thumb" src="${thumbUrl}" alt="${file.name}">
            <div class="file-item-info">
                <span class="file-item-name" title="${file.name}">${displayFileName(file.name)}</span>
                <span class="file-item-size">${formatBytes(file.size)}</span>
            </div>
            <button class="file-item-remove" type="button" aria-label="${t('removeLabel', file.name)}" data-index="${index}">✕</button>
        `;
        fileListEl.appendChild(li);
    });

    fileListEl.querySelectorAll('.file-item-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.index);
            selectedFiles.splice(idx, 1);
            renderFileList();
        });
    });
}

function resetSelection() {
    selectedFiles = [];
    fileInput.value = '';
    renderFileList();
    clearErrors();
}

// Formatos RAW de cámara: los navegadores no pueden decodificarlos aunque
// a veces reporten un MIME "image/*" — hay que filtrarlos por extensión.
const RAW_EXTENSIONS = ['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'orf', 'rw2', 'srw', 'pef', 'raw'];

function isRawFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return RAW_EXTENSIONS.includes(ext);
}

async function addFiles(fileArray) {
    for (const file of fileArray) {
        if (isRawFile(file)) {
            showError(t('errRaw', file.name));
            continue;
        }

        if (!file.type.startsWith('image/')) {
            showError(t('errInvalidFormat', file.name));
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError(t('errTooLarge', file.name));
            continue;
        }

        if (selectedFiles.length >= MAX_FILES) {
            showError(t('errMaxFiles', MAX_FILES));
            break;
        }

        if (totalSize() + file.size > MAX_TOTAL_SIZE) {
            showError(t('errMaxTotal', formatBytes(MAX_TOTAL_SIZE)));
            break;
        }

        let looksReal;
        try {
            looksReal = await hasRealImageSignature(file);
        } catch {
            looksReal = true; // si no pudimos leer los bytes, dejamos que el decode real decida
        }

        if (!looksReal) {
            showError(t('errNotRealImage', file.name));
            continue;
        }

        selectedFiles.push(file);
    }

    renderFileList();
}

fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
});

// Drag & drop en toda la página (no solo el dropzone)
let dragCounter = 0;

function hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
}

document.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.add('active');
    dropzone.classList.add('dragover');
});

document.addEventListener('dragover', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
});

document.addEventListener('dragleave', (e) => {
    if (!hasFiles(e)) return;
    dragCounter--;
    if (dragCounter <= 0) {
        dragCounter = 0;
        dropOverlay.classList.remove('active');
        dropzone.classList.remove('dragover');
    }
});

document.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    dropzone.classList.remove('dragover');
    addFiles(Array.from(e.dataTransfer.files));
});

function zipTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function ratioText(ratio) {
    if (ratio > 0.5) return t('compressed', ratio.toFixed(0));
    if (ratio < -0.5) return t('heavier', Math.abs(ratio).toFixed(0));
    return t('noChange');
}

function renderResultCards() {
    resultCardsEl.innerHTML = '';

    processedResults.forEach((item, itemIndex) => {
        const group = document.createElement('div');
        group.className = 'image-group';

        const tiles = PRESET_ORDER.map((key) => {
            const preset = item.presets[key];
            const codeLines = Math.ceil(preset.base64Length / 76).toLocaleString(currentLang === 'en' ? 'en-US' : 'es-CO');
            return `
                <div class="preset-tile">
                    <div>
                        <span class="preset-badge ${key}">${key}</span>
                        <div class="preset-tile-sizes">${formatBytes(item.originalFile.size)} → <strong>${preset.sizeFmt}</strong></div>
                        <div class="preset-tile-ratio ${key}">${ratioText(preset.ratio)}</div>
                        <div class="preset-tile-code">${t('codeLines', codeLines)}</div>
                    </div>
                    <div class="preset-tile-actions">
                        <button type="button" class="btn-preview" data-item="${itemIndex}" data-preset="${key}" aria-label="${t('viewLabel', key)}">
                            <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button type="button" class="btn-download-tile" data-item="${itemIndex}" data-preset="${key}" aria-label="${t('downloadLabel', key)}">
                            <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        group.innerHTML = `
            <div class="image-group-header">
                <img class="image-group-thumb" src="${item.presets.light.dataUri}" alt="${item.originalFile.name}">
                <div class="image-group-header-text">
                    <div class="image-group-title" title="${item.originalFile.name}">${item.originalFile.name}</div>
                    <div class="image-group-meta">${item.originalDimensions.width}×${item.originalDimensions.height} · ${formatBytes(item.originalFile.size)} ${t('original')}</div>
                </div>
            </div>
            <div class="preset-grid">${tiles}</div>
        `;

        resultCardsEl.appendChild(group);
    });

    resultCardsEl.querySelectorAll('.btn-download-tile').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const item = processedResults[Number(btn.dataset.item)];
            const presetKey = btn.dataset.preset;
            btn.disabled = true;
            try {
                const microZip = await buildMicroZip(item, presetKey);
                downloadBlob(microZip, `${item.baseName}-${presetKey}.zip`);
            } catch (err) {
                console.error(err);
                showError(t('errGenericDownload'));
            } finally {
                btn.disabled = false;
            }
        });
    });

    resultCardsEl.querySelectorAll('.btn-preview').forEach((btn) => {
        btn.addEventListener('click', () => {
            openModal(Number(btn.dataset.item), PRESET_ORDER.indexOf(btn.dataset.preset));
        });
    });
}

function updateModal() {
    const item = processedResults[modalItemIndex];
    const presetKey = PRESET_ORDER[modalPresetIndex];
    const preset = item.presets[presetKey];
    modalImage.src = preset.dataUri;
    modalImage.alt = `${item.originalFile.name} — ${presetKey}`;
    modalLevelBadge.textContent = presetKey.toUpperCase();
    modalLevelBadge.className = `modal-level-badge ${presetKey}`;
    modalCaption.textContent = `${item.originalFile.name} · ${preset.sizeFmt} · ${preset.width}×${preset.height}`;
}

function openModal(itemIndex, presetIndex) {
    modalItemIndex = itemIndex;
    modalPresetIndex = presetIndex;
    updateModal();
    previewModal.hidden = false;
}

function closeModal() {
    previewModal.hidden = true;
    modalImage.src = '';
}

function modalStep(delta) {
    modalPresetIndex = (modalPresetIndex + delta + PRESET_ORDER.length) % PRESET_ORDER.length;
    updateModal();
}

modalClose.addEventListener('click', closeModal);
previewModalBackdrop.addEventListener('click', closeModal);
modalPrev.addEventListener('click', () => modalStep(-1));
modalNext.addEventListener('click', () => modalStep(1));

document.addEventListener('keydown', (e) => {
    if (previewModal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') modalStep(-1);
    if (e.key === 'ArrowRight') modalStep(1);
});

function showResultsView() {
    uploadContainer.hidden = true;
    resultsContainer.hidden = false;
    renderResultCards();
}

function showUploadView() {
    resultsContainer.hidden = true;
    uploadContainer.hidden = false;
    processedResults = [];
    resetSelection();
}

btnConvert.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    btnConvert.disabled = true;
    clearErrors();

    const processed = [];

    for (let i = 0; i < selectedFiles.length; i++) {
        btnConvert.textContent = t('converting', i + 1, selectedFiles.length);
        try {
            processed.push(await processFile(selectedFiles[i]));
        } catch (err) {
            console.error(err);
            if (err.code === 'DIMENSIONS_TOO_LARGE') {
                showError(t('errTooBigDims', selectedFiles[i].name));
            } else {
                showError(t('errFileFailed', selectedFiles[i].name));
            }
        }
    }

    processed.forEach((item) => {
        if (!item.formatPreserved) {
            showError(t('errFormatFallback', item.originalFile.name, item.ext.slice(1).toUpperCase()));
        }
    });

    btnConvert.textContent = t('convert');
    btnConvert.disabled = selectedFiles.length === 0;

    if (processed.length > 0) {
        processedResults = processed;
        showResultsView();
    }
});

btnDownloadAll.addEventListener('click', async () => {
    if (processedResults.length === 0) return;
    btnDownloadAll.disabled = true;
    btnDownloadAll.textContent = t('generatingZip');

    try {
        const zipBlob = await buildZip(processedResults);
        const zipName = processedResults.length === 1
            ? `${processedResults[0].baseName}-base64.zip`
            : `imagenes-base64-${zipTimestamp()}.zip`;
        downloadBlob(zipBlob, zipName);
    } catch (err) {
        console.error(err);
        showError(t('errGenericZip'));
    } finally {
        btnDownloadAll.textContent = t('downloadAll');
        btnDownloadAll.disabled = false;
    }
});

btnBack.addEventListener('click', () => {
    showUploadView();
});

// Theme switch
const themeLightBtn = document.getElementById('theme-light');
const themeDarkBtn = document.getElementById('theme-dark');

function getActiveTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeLightBtn.classList.toggle('active', theme === 'light');
    themeDarkBtn.classList.toggle('active', theme === 'dark');
}

themeLightBtn.addEventListener('click', () => setTheme('light'));
themeDarkBtn.addEventListener('click', () => setTheme('dark'));

setTheme(getActiveTheme());

// Language switch
const langEsBtn = document.getElementById('lang-es');
const langEnBtn = document.getElementById('lang-en');

function updateLangButtons() {
    langEsBtn.classList.toggle('active', currentLang === 'es');
    langEnBtn.classList.toggle('active', currentLang === 'en');
}

function onLanguageChange() {
    updateLangButtons();
    if (!btnConvert.disabled || selectedFiles.length > 0) {
        renderFileList();
    }
    if (!resultsContainer.hidden) {
        renderResultCards();
    }
}

langEsBtn.addEventListener('click', () => setLanguage('es'));
langEnBtn.addEventListener('click', () => setLanguage('en'));

currentLang = detectLanguage();
applyStaticTranslations();
updateLangButtons();
