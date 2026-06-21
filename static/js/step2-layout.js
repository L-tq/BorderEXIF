/* Step 2: Layout setup and preview — client-side only */

(function () {
  let config = null;
  let previewTimer = null;
  let prevPreviewUrl = null;

  const COMMON_EXIF_TAGS = [
    'Camera Make', 'Camera Model', 'Lens Make', 'Lens Model',
    'Focal Length', 'Aperture', 'ISO', 'Exposure Time', 'F-Number',
    'Date/Time', 'Artist', 'Software', 'GPS'
  ];
  const FONT_FAMILIES = ['Roboto', 'Source Han Sans'];
  const FONT_WEIGHTS = ['normal', 'bold', 'thin', 'light', 'medium'];
  const FONT_STYLES = ['normal', 'italic'];

  function initStep2() {
    config = AppState.loadConfig();
    initBorderMode();
    initScaleConfig();
    renderLogos();
    renderTextLines();
    populateImageSelector();
  }

  document.addEventListener('DOMContentLoaded', initStep2);
  window.initStep2 = initStep2;

  // --- Border ---
  function initBorderMode() {
    if (!config || !config.border) return;
    const b = config.border;
    const mode = b.mode || 'custom';
    const radio = document.querySelector(`input[name="borderMode"][value="${mode}"]`);
    if (radio) radio.checked = true;

    document.getElementById('borderTop').value = (b.top != null) ? b.top : 0;
    document.getElementById('borderBottom').value = (b.bottom != null) ? b.bottom : 500;
    document.getElementById('borderLeft').value = (b.left != null) ? b.left : 0;
    document.getElementById('borderRight').value = (b.right != null) ? b.right : 0;
    document.getElementById('borderColor').value = b.color || '#FFFFFF';
    document.getElementById('autoParam').value = b.auto_param || 'b';
    document.getElementById('aspectA').value = (b.a != null) ? b.a : 0;
    document.getElementById('aspectB').value = (b.b != null) ? b.b : 0;
    document.getElementById('aspectC').value = (b.c != null) ? b.c : 500;
    document.getElementById('targetW').value = b.target_w || 16;
    document.getElementById('targetH').value = b.target_h || 9;
    document.getElementById('targetAutoParam').value = b.auto_param || 'b';
    document.getElementById('targetA').value = (b.a != null) ? b.a : 0;
    document.getElementById('targetB').value = (b.b != null) ? b.b : 0;
    document.getElementById('targetC').value = (b.c != null) ? b.c : 500;

    document.getElementById('lineSpacing').value = config.line_spacing || 1.3;
    document.getElementById('textMarginLeft').value = config.text_margin_left || 700;
    document.getElementById('textMarginRight').value = config.text_margin_right || 200;
    document.getElementById('textMarginBottom').value = config.text_margin_bottom || 170;
    document.getElementById('linesGap').value = config.text_lines_spacing || 8;
    document.getElementById('textVerticalAlign').value = config.text_vertical_align || 'baseline';

    onBorderModeChange();
  }

  window.onBorderModeChange = function () {
    const mode = document.querySelector('input[name="borderMode"]:checked').value;
    document.getElementById('borderCustom').style.display = mode === 'custom' ? 'block' : 'none';
    document.getElementById('borderAspect').style.display = mode === 'aspect_ratio' ? 'block' : 'none';
    document.getElementById('borderTargetRatio').style.display = mode === 'target_ratio' ? 'block' : 'none';
    config.border.mode = mode;
    updateAutoParamState();
    updateTargetAutoParamState();
    debouncePreview();
  };

  function updateAutoParamState() {
    const autoParam = document.getElementById('autoParam').value;
    document.getElementById('aspectA').disabled = autoParam === 'a';
    document.getElementById('aspectB').disabled = autoParam === 'b';
    document.getElementById('aspectC').disabled = autoParam === 'c';
  }
  function updateTargetAutoParamState() {
    const autoParam = document.getElementById('targetAutoParam').value;
    document.getElementById('targetA').disabled = autoParam === 'a';
    document.getElementById('targetB').disabled = autoParam === 'b';
    document.getElementById('targetC').disabled = autoParam === 'c';
  }

  document.getElementById('autoParam').addEventListener('change', () => { updateAutoParamState(); debouncePreview(); });
  document.getElementById('targetAutoParam').addEventListener('change', () => { updateTargetAutoParamState(); debouncePreview(); });

  // --- Image Scaling ---
  function getScaleConfig() {
    const enabled = document.getElementById('scaleEnabled').checked;
    return {
      enabled: enabled,
      width: parseInt(document.getElementById('scaleWidth').value) || 0,
      height: parseInt(document.getElementById('scaleHeight').value) || 0,
    };
  }

  window.onScaleToggle = function () {
    const enabled = document.getElementById('scaleEnabled').checked;
    document.getElementById('scaleDimensions').style.display = enabled ? 'block' : 'none';
    debouncePreview();
  };

  function updateOriginalSizeLabel() {
    const select = document.getElementById('previewImageSelect');
    const filename = select?.value;
    const img = AppState.images.find(i => i.filename === filename);
    const label = document.getElementById('originalSizeLabel');
    if (img && img.width && img.height) {
      label.textContent = `${img.width} x ${img.height} px`;
      const enabled = document.getElementById('scaleEnabled').checked;
      if (!enabled) {
        document.getElementById('scaleWidth').value = img.width;
        document.getElementById('scaleHeight').value = img.height;
      }
    } else {
      label.textContent = '—';
    }
  }

  function initScaleConfig() {
    const sc = config?.scale || {};
    document.getElementById('scaleEnabled').checked = sc.enabled || false;
    if (sc.width) document.getElementById('scaleWidth').value = sc.width;
    if (sc.height) document.getElementById('scaleHeight').value = sc.height;
    onScaleToggle();
  }

  // --- Logos ---
  function renderLogos() {
    const container = document.getElementById('logosList');
    const logos = config?.logos || [];
    container.innerHTML = '';
    logos.forEach((logo, idx) => {
      const div = document.createElement('div');
      div.className = 'logo-item';
      div.innerHTML = [
        '<div class="logo-header">',
        `<span class="logo-name">Logo ${idx + 1}: ${esc(logo.filename || '—')}</span>`,
        `<button class="btn-danger btn-xs" onclick="removeLogo(${idx})">✕</button>`,
        '</div>',
        `<div class="te-row"><label>File</label><span style="font-size:0.8rem;">${esc(logo.filename || '')}</span></div>`,
        `<div class="te-row"><label>Width</label><input type="number" value="${logo.width || 400}" min="10" onchange="updateLogo(${idx},'width',this.value)"></div>`,
        `<div class="te-row"><label>Height</label><input type="number" value="${logo.height || 400}" min="10" onchange="updateLogo(${idx},'height',this.value)"></div>`,
        `<div class="te-row"><label>offset_x</label><input type="number" value="${logo.offset_x || 200}" onchange="updateLogo(${idx},'offset_x',this.value)"></div>`,
        `<div class="te-row"><label>offset_y</label><input type="number" value="${logo.offset_y || 60}" onchange="updateLogo(${idx},'offset_y',this.value)"></div>`,
      ].join('');
      container.appendChild(div);
    });
  }

  window.addLogo = function () {
    const input = document.getElementById('logoFileInput');
    input.click();
    input.onchange = async () => {
      if (!input.files.length) return;
      try {
        const logoData = await AppState.addLogo(input.files[0]);
        if (!logoData) { alert('Failed to load logo'); return; }
        if (!config.logos) config.logos = [];
        config.logos.push(logoData);
        AppState.saveConfig(config);
        renderLogos();
        debouncePreview();
      } catch (err) {
        alert('Failed to add logo: ' + err.message);
      }
      input.value = '';
    };
  };

  window.updateLogo = function (idx, field, value) {
    config.logos[idx][field] = parseInt(value) || 0;
    AppState.saveConfig(config);
    debouncePreview();
  };

  window.removeLogo = function (idx) {
    config.logos.splice(idx, 1);
    AppState.saveConfig(config);
    renderLogos();
    debouncePreview();
  };

  // --- Text Lines ---
  function renderTextLines() {
    const container = document.getElementById('textLinesList');
    const lines = config?.text_lines || [];
    container.innerHTML = '';
    lines.forEach((line, idx) => {
      const div = document.createElement('div');
      div.className = 'text-line';
      div.draggable = true;
      div.dataset.idx = idx;
      div.innerHTML = [
        '<div class="tl-header">',
        `<span class="tl-name">Line ${idx + 1}</span>`,
        `<button class="btn-danger btn-xs" onclick="event.stopPropagation(); removeTextLine(${idx})">✕</button>`,
        '</div>',
        '<div class="tl-parts">',
        _renderPart(idx, 'left', line.left),
        _renderPart(idx, 'center', line.center),
        _renderPart(idx, 'right', line.right),
        '</div>',
        '<div class="tl-tag-hint">',
        '<span style="font-size:0.72rem; color:#888;">Insert tag into </span>',
        `<select id="tl_part_sel_${idx}" style="font-size:0.72rem; padding:1px 2px; border:1px solid #ddd; border-radius:3px;">`,
        '<option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>',
        '</select>',
        '<span style="font-size:0.72rem; color:#888;">: </span>',
        COMMON_EXIF_TAGS.slice(0, 8).map(t =>
          `<span onclick="insertTag(${idx},document.getElementById('tl_part_sel_${idx}').value,'${esc(t)}')" title="Insert tag">${esc(t)}</span>`
        ).join(' · '),
        '</div>',
      ].join('');
      div.addEventListener('dragstart', onDragStart);
      div.addEventListener('dragover', onDragOver);
      div.addEventListener('drop', onDrop);
      div.addEventListener('dragend', onDragEnd);
      container.appendChild(div);
    });
  }

  function _renderPart(idx, name, part) {
    const p = (part && typeof part === 'object') ? part : { text: part || '' };
    const text = esc(p.text || '');
    const family = p.font_family || 'Roboto';
    const weight = p.font_weight || 'normal';
    const style = p.font_style || 'normal';
    const size = p.font_size || 22;
    const color = p.font_color || '#333333';

    const familyOpts = FONT_FAMILIES.map(f =>
      `<option value="${f}" ${family === f ? 'selected' : ''}>${f}</option>`
    ).join('');
    const weightOpts = FONT_WEIGHTS.map(w =>
      `<option value="${w}" ${weight === w ? 'selected' : ''}>${w}</option>`
    ).join('');
    const styleOpts = FONT_STYLES.map(s =>
      `<option value="${s}" ${style === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const capName = name.charAt(0).toUpperCase() + name.slice(1);
    return [
      `<div class="tl-part">`,
      `<label>${capName}</label>`,
      `<input type="text" value="${text}" onchange="updatePartText(${idx},'${name}',this.value)" id="tl_${name}_${idx}">`,
      `<div class="tl-part-font">`,
      `<select onchange="updatePartFont(${idx},'${name}','font_family',this.value)">${familyOpts}</select>`,
      `<select onchange="updatePartFont(${idx},'${name}','font_weight',this.value)">${weightOpts}</select>`,
      `<select onchange="updatePartFont(${idx},'${name}','font_style',this.value)">${styleOpts}</select>`,
      `<input type="number" value="${size}" min="8" max="200" onchange="updatePartFont(${idx},'${name}','font_size',this.value)">`,
      `<input type="color" value="${color}" onchange="updatePartFont(${idx},'${name}','font_color',this.value)">`,
      `</div>`,
      `</div>`,
    ].join('');
  }

  window.addTextLine = function () {
    if (!config.text_lines) config.text_lines = [];
    const defaultPart = { text: '', font_family: 'Roboto', font_size: 20, font_color: '#777777', font_weight: 'normal', font_style: 'normal' };
    config.text_lines.push({
      left: { ...defaultPart },
      center: { ...defaultPart },
      right: { ...defaultPart },
    });
    AppState.saveConfig(config);
    renderTextLines();
    debouncePreview();
  };

  window.removeTextLine = function (idx) {
    config.text_lines.splice(idx, 1);
    AppState.saveConfig(config);
    renderTextLines();
    debouncePreview();
  };

  window.updatePartText = function (idx, part, value) {
    if (typeof config.text_lines[idx][part] !== 'object') {
      config.text_lines[idx][part] = { text: '' };
    }
    config.text_lines[idx][part].text = value;
    AppState.saveConfig(config);
    debouncePreview();
  };

  window.updatePartFont = function (idx, part, field, value) {
    const numFields = ['font_size'];
    if (typeof config.text_lines[idx][part] !== 'object') {
      config.text_lines[idx][part] = { text: config.text_lines[idx][part] || '' };
    }
    config.text_lines[idx][part][field] = numFields.includes(field) ? (parseInt(value) || 18) : value;
    AppState.saveConfig(config);
    debouncePreview();
  };

  window.insertTag = function (idx, part, tagName) {
    const inputId = `tl_${part}_${idx}`;
    const input = document.getElementById(inputId);
    if (!input) return;
    const tagPlaceholder = '{' + tagName + '}';
    const cursorPos = input.selectionStart || input.value.length;
    const before = input.value.substring(0, cursorPos);
    const after = input.value.substring(cursorPos);
    input.value = before + tagPlaceholder + after;
    input.focus();
    input.selectionStart = input.selectionEnd = cursorPos + tagPlaceholder.length;
    if (typeof config.text_lines[idx][part] !== 'object') {
      config.text_lines[idx][part] = { text: '' };
    }
    config.text_lines[idx][part].text = input.value;
    AppState.saveConfig(config);
    debouncePreview();
  };

  // --- Drag & Drop for Text Lines ---
  let dragIdx = null;
  function onDragStart(e) {
    dragIdx = parseInt(e.target.closest('.text-line').dataset.idx);
    e.target.closest('.text-line').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function onDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.text-line');
    if (!target || dragIdx === null) return;
    const dropIdx = parseInt(target.dataset.idx);
    if (dragIdx !== dropIdx) {
      const moved = config.text_lines.splice(dragIdx, 1)[0];
      config.text_lines.splice(dropIdx, 0, moved);
      AppState.saveConfig(config);
      renderTextLines();
      debouncePreview();
    }
    dragIdx = null;
  }
  function onDragEnd(e) {
    const el = e.target.closest('.text-line');
    if (el) el.classList.remove('dragging');
  }

  // --- Preview ---
  function populateImageSelector() {
    const select = document.getElementById('previewImageSelect');
    const images = AppState.images;
    select.innerHTML = images.map((img, i) => {
      const dims = (img.width && img.height) ? ` (${img.width}x${img.height})` : '';
      return `<option value="${esc(img.filename)}" ${i === 0 ? 'selected' : ''}>${esc(img.filename)}${dims}</option>`;
    }).join('');
    if (images.length > 0) {
      updateOriginalSizeLabel();
      setTimeout(() => debouncePreview(), 300);
    }
  }

  function getCurrentBorderConfig() {
    const mode = document.querySelector('input[name="borderMode"]:checked')?.value || 'custom';
    const top = parseInt(document.getElementById('borderTop').value);
    const bottom = parseInt(document.getElementById('borderBottom').value);
    const left = parseInt(document.getElementById('borderLeft').value);
    const right = parseInt(document.getElementById('borderRight').value);

    let a, b_val, c_val, auto_param, target_w, target_h;
    if (mode === 'target_ratio') {
      a = parseInt(document.getElementById('targetA').value);
      b_val = parseInt(document.getElementById('targetB').value);
      c_val = parseInt(document.getElementById('targetC').value);
      auto_param = document.getElementById('targetAutoParam').value;
      target_w = parseInt(document.getElementById('targetW').value);
      target_h = parseInt(document.getElementById('targetH').value);
    } else {
      a = parseInt(document.getElementById('aspectA').value);
      b_val = parseInt(document.getElementById('aspectB').value);
      c_val = parseInt(document.getElementById('aspectC').value);
      auto_param = document.getElementById('autoParam').value;
      target_w = config?.border?.target_w || 16;
      target_h = config?.border?.target_h || 9;
    }

    return {
      mode: mode,
      top: isNaN(top) ? 0 : top,
      bottom: isNaN(bottom) ? 0 : bottom,
      left: isNaN(left) ? 0 : left,
      right: isNaN(right) ? 0 : right,
      color: document.getElementById('borderColor').value,
      auto_param: auto_param,
      a: isNaN(a) ? 0 : a,
      b: isNaN(b_val) ? 0 : b_val,
      c: isNaN(c_val) ? 0 : c_val,
      target_w: isNaN(target_w) ? 16 : target_w,
      target_h: isNaN(target_h) ? 9 : target_h,
    };
  }

  function getGlobalTextConfig() {
    return {
      line_spacing: parseFloat(document.getElementById('lineSpacing').value) || 1.3,
      text_margin_left: parseInt(document.getElementById('textMarginLeft').value) || 0,
      text_margin_right: parseInt(document.getElementById('textMarginRight').value) || 0,
      text_margin_bottom: parseInt(document.getElementById('textMarginBottom').value) || 0,
      text_lines_spacing: parseInt(document.getElementById('linesGap').value) || 8,
      text_vertical_align: document.getElementById('textVerticalAlign').value || 'baseline',
    };
  }

  window.debouncePreview = function () {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      saveConfig();
      generatePreview();
    }, 400);
  };

  async function generatePreview() {
    const select = document.getElementById('previewImageSelect');
    const filename = select?.value;
    if (!filename) return;

    const imageData = AppState.images.find(i => i.filename === filename);
    if (!imageData) return;

    const mergedConfig = {
      border: getCurrentBorderConfig(),
      logos: config?.logos || [],
      text_lines: config?.text_lines || [],
      line_spacing: parseFloat(document.getElementById('lineSpacing').value) || 1.3,
      text_margin_left: parseInt(document.getElementById('textMarginLeft').value) || 700,
      text_margin_right: parseInt(document.getElementById('textMarginRight').value) || 200,
      text_margin_bottom: parseInt(document.getElementById('textMarginBottom').value) || 170,
      text_lines_spacing: parseInt(document.getElementById('linesGap').value) || 8,
      text_vertical_align: document.getElementById('textVerticalAlign').value || 'baseline',
      scale: getScaleConfig(),
    };

    try {
      const canvas = await ImageRenderer.renderPreview(imageData, mergedConfig, 900);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      const url = URL.createObjectURL(blob);

      const previewImg = document.getElementById('previewImage');
      const placeholder = document.getElementById('previewPlaceholder');
      previewImg.src = url;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';

      if (prevPreviewUrl) URL.revokeObjectURL(prevPreviewUrl);
      prevPreviewUrl = url;
    } catch (err) {
      console.error('Preview failed:', err);
    }
  }

  // --- Save config ---
  function saveConfig() {
    if (!config.border) config.border = {};
    Object.assign(config.border, getCurrentBorderConfig());
    config.line_spacing = parseFloat(document.getElementById('lineSpacing').value) || 1.3;
    config.text_margin_left = parseInt(document.getElementById('textMarginLeft').value) || 700;
    config.text_margin_right = parseInt(document.getElementById('textMarginRight').value) || 200;
    config.text_margin_bottom = parseInt(document.getElementById('textMarginBottom').value) || 170;
    config.text_lines_spacing = parseInt(document.getElementById('linesGap').value) || 8;
    config.text_vertical_align = document.getElementById('textVerticalAlign').value || 'baseline';
    if (!config.scale) config.scale = {};
    Object.assign(config.scale, getScaleConfig());
    AppState.saveConfig(config);
  }

  window.goToStep3 = function () {
    saveConfig();
    AppState.navigate(3);
  };

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
