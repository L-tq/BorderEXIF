/* Step 1: File selection and EXIF summary — client-side only */

(function () {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const tableWrapper = document.getElementById('tableWrapper');
  const tableBody = document.getElementById('imagesTableBody');
  const imageCount = document.getElementById('imageCount');
  const exifDetail = document.getElementById('exifDetail');
  const exifDetailName = document.getElementById('exifDetailName');
  const exifDetailContent = document.getElementById('exifDetailContent');
  const btnNext = document.getElementById('btnNext');

  function renderTable() {
    tableBody.innerHTML = '';
    const images = AppState.images;
    if (images.length === 0) {
      tableWrapper.style.display = 'none';
      btnNext.disabled = true;
      return;
    }
    tableWrapper.style.display = 'block';
    btnNext.disabled = false;
    imageCount.textContent = images.length + ' image(s) loaded';

    for (const img of images) {
      const tr = document.createElement('tr');
      tr.innerHTML = [
        `<td><strong>${esc(img.filename)}</strong></td>`,
        `<td>${img.width}×${img.height}</td>`,
        `<td>${esc(img.exif.camera_model || '—')}</td>`,
        `<td>${esc(img.exif.lens_model || '—')}</td>`,
        `<td>${esc(img.exif.focal_length || '—')}</td>`,
        `<td>${esc(img.exif.aperture || '—')}</td>`,
        `<td>${esc(img.exif.iso || '—')}</td>`,
        `<td>${esc(img.exif.exposure_time || '—')}</td>`,
        `<td>
            <button class="btn-danger" onclick="deleteImage('${esc(img.filename)}')">✕</button>
            <button class="btn btn-sm btn-secondary" style="margin-left:4px;" onclick="showExif('${esc(img.filename)}')">EXIF</button>
        </td>`,
      ].join('');
      tableBody.appendChild(tr);
    }
  }

  // Drop zone
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) await uploadFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) await uploadFiles(fileInput.files);
  });

  async function uploadFiles(fileList) {
    dropZone.textContent = 'Reading files & EXIF data...';
    try {
      await AppState.addImages(fileList);
      renderTable();
    } catch (err) {
      alert('Failed to read files: ' + err.message);
    } finally {
      dropZone.innerHTML = '<h2>Drop images here</h2><p>or click to browse — JPEG only</p>';
    }
  }

  window.showExif = function (filename) {
    const img = AppState.images.find(i => i.filename === filename);
    if (!img) return;
    exifDetailName.textContent = filename;
    exifDetailContent.innerHTML = renderExifTable(img.exif.all_tags || {});
    exifDetail.style.display = 'block';
  };

  function renderExifTable(tags) {
    const rows = Object.entries(tags).map(([k, v]) =>
      `<tr><td>${esc(String(k))}</td><td>${esc(String(v))}</td></tr>`
    ).join('');
    return `<table>${rows}</table>`;
  }

  window.deleteImage = function (filename) {
    AppState.removeImage(filename);
    renderTable();
  };

  window.clearAll = function () {
    AppState.clearAll();
    renderTable();
  };

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Expose renderTable globally for AppState navigation
  window.renderStep1Table = renderTable;
})();
