/* Step 3: Review and download — client-side only */

(function () {
  let renderedBlobs = [];

  function initStep3() {
    loadImagesForReview();
  }

  function loadImagesForReview() {
    const grid = document.getElementById('reviewGrid');
    grid.innerHTML = '';
    const images = AppState.images;

    if (!images || images.length === 0) {
      grid.innerHTML = '<p style="color:#888;">No images loaded. Go back to Step 1 to select images.</p>';
      document.getElementById('btnRender').disabled = true;
      return;
    }

    document.getElementById('btnRender').disabled = false;

    for (const img of images) {
      const card = document.createElement('div');
      card.className = 'review-card';
      card.id = 'card-' + img.filename.replace(/[^a-zA-Z0-9]/g, '_');
      card.innerHTML = `
        <div style="background:#f5f5f5; min-height:150px; display:flex; align-items:center; justify-content:center; border-radius:4px; color:#aaa; font-size:0.9rem;">
          Pending render
        </div>
        <div class="info">
          <strong>${esc(img.filename)}</strong><br>
          ${img.width}×${img.height} | ${esc(img.exif.camera_model || '—')}<br>
          ${esc(img.exif.lens_model || '')} ${esc(img.exif.focal_length || '')} ${esc(img.exif.aperture || '')}
        </div>
      `;
      grid.appendChild(card);
    }
  }

  window.renderAll = async function () {
    const btnRender = document.getElementById('btnRender');
    const btnDownloadAll = document.getElementById('btnDownloadAll');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const statusMsg = document.getElementById('statusMsg');

    const images = AppState.images;
    const config = AppState.config;

    if (!images || images.length === 0) {
      statusMsg.textContent = 'No images to render.';
      return;
    }

    btnRender.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    statusMsg.textContent = 'Rendering images...';

    try {
      renderedBlobs = await ImageRenderer.renderAll(images, config, (current, total, filename) => {
        const pct = Math.round((current / total) * 100);
        progressFill.style.width = pct + '%';
        statusMsg.textContent = `Rendering ${current + 1}/${total}: ${filename}`;
      });

      progressFill.style.width = '100%';

      if (renderedBlobs.length === 0) {
        statusMsg.textContent = 'No images were rendered.';
        btnRender.disabled = false;
        progressBar.style.display = 'none';
        return;
      }

      const successCount = renderedBlobs.filter(r => r.blob).length;
      statusMsg.textContent = `Rendered ${successCount}/${renderedBlobs.length} image(s).`;

      // Update review grid
      const grid = document.getElementById('reviewGrid');
      grid.innerHTML = '';

      for (const img of renderedBlobs) {
        const card = document.createElement('div');
        card.className = 'review-card';
        if (img.error) {
          card.innerHTML = `
            <div style="color:#e74c3c; padding:20px; text-align:center;">
              Error: ${esc(img.error)}
            </div>
            <div class="info"><strong>${esc(img.filename)}</strong></div>
          `;
        } else {
          const url = URL.createObjectURL(img.blob);
          card.innerHTML = `
            <img src="${url}" alt="${esc(img.filename)}" loading="lazy">
            <div class="info">
              <strong>${esc(img.filename)}</strong>
              <br>
              <a href="${url}" class="download-btn" download="${img.filename}">Download</a>
            </div>
          `;
        }
        grid.appendChild(card);
      }

      btnDownloadAll.style.display = 'inline-block';
      btnRender.disabled = false;
      progressBar.style.display = 'none';

    } catch (err) {
      statusMsg.textContent = 'Render failed: ' + err.message;
      btnRender.disabled = false;
      progressBar.style.display = 'none';
    }
  };

  window.downloadAll = async function () {
    if (renderedBlobs.length === 0) {
      alert('Please render images first.');
      return;
    }

    const zip = new JSZip();
    for (const { filename, blob } of renderedBlobs) {
      if (blob) zip.file(filename, blob);
    }

    const statusMsg = document.getElementById('statusMsg');
    statusMsg.textContent = 'Creating ZIP file...';

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exifborder_output.zip';
      a.click();
      URL.revokeObjectURL(url);
      statusMsg.textContent = 'ZIP download started.';
    } catch (err) {
      statusMsg.textContent = 'Failed to create ZIP: ' + err.message;
    }
  };

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.initStep3 = initStep3;
})();
