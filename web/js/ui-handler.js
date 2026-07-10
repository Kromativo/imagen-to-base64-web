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

let selectedFiles = []; // Array<File>

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
        <button class="error-item-dismiss" type="button" aria-label="Cerrar alerta">✕</button>
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
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <div class="file-item-info">
                <span class="file-item-name" title="${file.name}">${displayFileName(file.name)}</span>
                <span class="file-item-size">${formatBytes(file.size)}</span>
            </div>
            <button class="file-item-remove" type="button" aria-label="Quitar ${file.name}" data-index="${index}">✕</button>
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

function addFiles(fileArray) {
    for (const file of fileArray) {
        if (!file.type.startsWith('image/')) {
            showError(`"${file.name}" no es un formato válido — se omitió.`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError(`"${file.name}" supera el límite de 50MB — se omitió.`);
            continue;
        }

        if (selectedFiles.length >= MAX_FILES) {
            showError(`Límite de ${MAX_FILES} archivos a la vez alcanzado.`);
            break;
        }

        if (totalSize() + file.size > MAX_TOTAL_SIZE) {
            showError(`El peso combinado supera ${formatBytes(MAX_TOTAL_SIZE)}.`);
            break;
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

btnConvert.addEventListener('click', () => {
    if (selectedFiles.length === 0) return;
    console.log('Convertir click — lógica de conversión pendiente (Sprint 2)', selectedFiles);
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
