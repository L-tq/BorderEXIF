/* Image renderer — Canvas-based border, logo, text rendering. Ported from src/image_processor.py */

const ImageRenderer = (function () {
  const FAMILY_NAME_MAP = { 'Roboto': 'Roboto', 'Source Han Sans': 'Noto Sans SC' };

  const PLACEHOLDER_MAP = {
    'Camera Make': 'camera_make', 'Camera Model': 'camera_model',
    'Lens Make': 'lens_make', 'Lens Model': 'lens_model',
    'Focal Length': 'focal_length', 'Aperture': 'aperture',
    'ISO': 'iso', 'Exposure Time': 'exposure_time', 'F-Number': 'fnumber',
    'Date/Time': 'datetime', 'Artist': 'artist', 'Software': 'software', 'GPS': 'gps',
  };

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function isCJK(ch) {
    const cp = ch.codePointAt(0);
    return (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x3040 && cp <= 0x309f) ||
      (cp >= 0x30a0 && cp <= 0x30ff) || (cp >= 0xac00 && cp <= 0xd7af);
  }

  function textWidth(ctx, text) {
    if (!text) return 0;
    return ctx.measureText(text).width;
  }

  function wrapTextLines(ctx, text, fontStyle, maxWidth) {
    if (!text) return [];
    if (maxWidth == null) return [text];
    const lines = [];
    for (const paragraph of text.split('\n')) {
      if (!paragraph.trim()) { lines.push(''); continue; }
      const words = paragraph.split(' ');
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (textWidth(ctx, testLine) <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);
    }
    // Character-level wrapping for CJK
    const result = [];
    for (const line of lines) {
      if (textWidth(ctx, line) <= maxWidth) {
        result.push(line); continue;
      }
      let charLine = '';
      for (const ch of line) {
        const test = charLine + ch;
        if (textWidth(ctx, test) <= maxWidth) {
          charLine = test;
        } else {
          if (charLine) result.push(charLine);
          charLine = ch;
        }
      }
      if (charLine) result.push(charLine);
    }
    return result;
  }

  function resolvePlaceholders(text, exifData) {
    if (!text) return '';
    return text.replace(/\{([^}]+)\}/g, (match, tagName) => {
      tagName = tagName.trim();
      if (tagName in PLACEHOLDER_MAP) {
        const val = exifData[PLACEHOLDER_MAP[tagName]];
        if (val) return String(val);
      }
      const allTags = exifData.all_tags || {};
      if (tagName in allTags) return String(allTags[tagName]);
      for (const [k, v] of Object.entries(allTags)) {
        if (k.toLowerCase() === tagName.toLowerCase()) return String(v);
      }
      return match;
    });
  }

  function getFontString(part) {
    const family = (part && part.font_family) ? part.font_family : 'Roboto';
    const weight = (part && part.font_weight) || 'normal';
    const style = (part && part.font_style) || 'normal';
    const size = (part && part.font_size) || 22;

    const fontFamily = FAMILY_NAME_MAP[family] || FAMILY_NAME_MAP['Roboto'] || 'Roboto';

    const fontWeight = (weight === 'bold' || weight === 'medium') ? '700' :
      (weight === 'thin' || weight === 'light') ? '300' :
      (weight === 'normal') ? '400' : '400';
    const fontStyleVal = style === 'italic' ? 'italic ' : '';
    return `${fontStyleVal}${fontWeight} ${parseInt(size)}px "${fontFamily}"`;
  }

  async function ensureFontsLoaded(textLines) {
    await document.fonts.ready;
    for (const line of textLines || []) {
      for (const part of ['left', 'center', 'right']) {
        const p = line[part];
        if (p && typeof p === 'object' && p.text) {
          const fontStr = getFontString(p);
          try { await document.fonts.load(fontStr); } catch (e) { /* ignore */ }
        }
      }
    }
  }

  function applyOrientation(ctx, img, orientation) {
    const w = img.naturalWidth, h = img.naturalHeight;
    switch (orientation) {
      case 1: break;
      case 2: ctx.translate(w, 0); ctx.scale(-1, 1); break;
      case 3: ctx.translate(w, h); ctx.rotate(Math.PI); break;
      case 4: ctx.translate(0, h); ctx.scale(1, -1); break;
      case 5: ctx.translate(h, 0); ctx.rotate(Math.PI / 2); ctx.scale(-1, 1); break;
      case 6: ctx.translate(h, 0); ctx.rotate(Math.PI / 2); break;
      case 7: ctx.translate(0, w); ctx.rotate(-Math.PI / 2); ctx.scale(-1, 1); break;
      case 8: ctx.translate(0, w); ctx.rotate(-Math.PI / 2); break;
      default: break;
    }
  }

  function getEffectiveDimensions(img, orientation) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (orientation >= 5 && orientation <= 8) return { width: h, height: w };
    return { width: w, height: h };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  async function loadLogoImage(logoCfg) {
    const src = logoCfg.dataUrl || logoCfg.path || '';
    if (!src) return null;
    try { return await loadImage(src); } catch (e) { return null; }
  }

  async function drawLogos(ctx, logosCfg, border, canvasW, canvasH) {
    for (const logo of logosCfg) {
      const img = await loadLogoImage(logo);
      if (!img) continue;
      const tw = parseInt(logo.width) || img.naturalWidth || 200;
      const th = parseInt(logo.height) || img.naturalHeight || 60;
      const ox = parseInt(logo.offset_x) || 0;
      const oy = parseInt(logo.offset_y) || 0;
      ctx.drawImage(img, ox, canvasH - oy - th, tw, th);
    }
  }

  function resolvePartFont(part, exifData) {
    const text = resolvePlaceholders(part.text || '', exifData);
    const fontString = getFontString(part);
    const color = hexToRgb(part.font_color || '#333333');
    return { text, fontString, color };
  }

  function measureMetrics(ctx, fontString) {
    ctx.font = fontString;
    const m = ctx.measureText('Ag');
    const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || 0;
    const descent = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || 0;
    return { ascent, descent, height: (ascent + descent) || 30 };
  }

  function drawTextOverlays(ctx, imgW, imgH, border, textLines, globalConfig, exifData) {
    const bottomH = border.bottom;
    if (bottomH <= 0 || !textLines || !textLines.length) return;

    const leftMargin = parseInt(globalConfig.text_margin_left) || 40;
    const rightMargin = parseInt(globalConfig.text_margin_right) || 40;
    const bottomMargin = parseInt(globalConfig.text_margin_bottom) || 30;
    const lineSpacing = parseFloat(globalConfig.line_spacing) || 1.3;
    const linesGap = parseInt(globalConfig.text_lines_spacing) || 8;
    const verticalAlign = globalConfig.text_vertical_align || 'baseline';

    const canvasW = imgW + border.left + border.right;
    const canvasH = imgH + border.top + border.bottom;
    const centerX = canvasW / 2;

    // First pass: calculate total height
    const lineLayouts = [];
    let totalH = 0;

    for (const lineCfg of textLines) {
      const left = resolvePartFont(lineCfg.left || {}, exifData);
      const center = resolvePartFont(lineCfg.center || {}, exifData);
      const right = resolvePartFont(lineCfg.right || {}, exifData);

      ctx.font = left.fontString;
      const leftLines = wrapTextLines(ctx, left.text, left.fontString, null);
      ctx.font = center.fontString;
      const centerLines = wrapTextLines(ctx, center.text, center.fontString, null);
      ctx.font = right.fontString;
      const rightLines = wrapTextLines(ctx, right.text, right.fontString, null);

      const leftMetrics = measureMetrics(ctx, left.fontString);
      const centerMetrics = measureMetrics(ctx, center.fontString);
      const rightMetrics = measureMetrics(ctx, right.fontString);

      const lhLeft = leftMetrics.height * lineSpacing;
      const lhCenter = centerMetrics.height * lineSpacing;
      const lhRight = rightMetrics.height * lineSpacing;
      const lh = Math.max(lhLeft, lhCenter, lhRight) || 1;

      const maxSubs = Math.max(leftLines.length, centerLines.length, rightLines.length, 1);
      const lineTotalH = maxSubs * lh + linesGap;

      lineLayouts.push({ leftLines, leftFont: left.fontString, leftColor: left.color,
        leftMetrics,
        centerLines, centerFont: center.fontString, centerColor: center.color,
        centerMetrics,
        rightLines, rightFont: right.fontString, rightColor: right.color,
        rightMetrics,
        lineHeight: lh, totalH: lineTotalH, maxSubs });
      totalH += lineTotalH;
    }

    if (!lineLayouts.length) return;
    totalH -= linesGap;

    let currentY = canvasH - bottomMargin - totalH;

    for (const layout of lineLayouts) {
      for (let i = 0; i < layout.maxSubs; i++) {
        const rowTop = currentY + i * layout.lineHeight;

        if (verticalAlign === 'center') {
          // Each part vertically centered within the row
          if (i < layout.leftLines.length && layout.leftLines[i]) {
            ctx.font = layout.leftFont;
            ctx.textAlign = 'left';
            ctx.fillStyle = `rgb(${layout.leftColor.join(',')})`;
            const partH = layout.leftMetrics.height * lineSpacing;
            const yOff = (layout.lineHeight - partH) / 2;
            ctx.fillText(layout.leftLines[i], leftMargin, rowTop + yOff);
          }
          if (i < layout.centerLines.length && layout.centerLines[i]) {
            ctx.font = layout.centerFont;
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgb(${layout.centerColor.join(',')})`;
            const partH = layout.centerMetrics.height * lineSpacing;
            const yOff = (layout.lineHeight - partH) / 2;
            ctx.fillText(layout.centerLines[i], centerX, rowTop + yOff);
          }
          if (i < layout.rightLines.length && layout.rightLines[i]) {
            ctx.font = layout.rightFont;
            ctx.textAlign = 'right';
            ctx.fillStyle = `rgb(${layout.rightColor.join(',')})`;
            const partH = layout.rightMetrics.height * lineSpacing;
            const yOff = (layout.lineHeight - partH) / 2;
            ctx.fillText(layout.rightLines[i], canvasW - rightMargin, rowTop + yOff);
          }
        } else {
          // Baseline alignment: all parts share the same baseline
          const maxDescent = Math.max(
            i < layout.leftLines.length && layout.leftLines[i] ? layout.leftMetrics.descent : 0,
            i < layout.centerLines.length && layout.centerLines[i] ? layout.centerMetrics.descent : 0,
            i < layout.rightLines.length && layout.rightLines[i] ? layout.rightMetrics.descent : 0
          );
          const commonY = rowTop + layout.lineHeight - maxDescent * lineSpacing;

          if (i < layout.leftLines.length && layout.leftLines[i]) {
            ctx.font = layout.leftFont;
            ctx.textAlign = 'left';
            ctx.fillStyle = `rgb(${layout.leftColor.join(',')})`;
            ctx.fillText(layout.leftLines[i], leftMargin, commonY);
          }
          if (i < layout.centerLines.length && layout.centerLines[i]) {
            ctx.font = layout.centerFont;
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgb(${layout.centerColor.join(',')})`;
            ctx.fillText(layout.centerLines[i], centerX, commonY);
          }
          if (i < layout.rightLines.length && layout.rightLines[i]) {
            ctx.font = layout.rightFont;
            ctx.textAlign = 'right';
            ctx.fillStyle = `rgb(${layout.rightColor.join(',')})`;
            ctx.fillText(layout.rightLines[i], canvasW - rightMargin, commonY);
          }
        }
      }
      currentY += layout.totalH;
    }
  }

  async function renderCanvas(imageData, config, maxDim) {
    const img = await loadImage(imageData.url);
    const exif = imageData.exif || {};
    const orientation = exif.orientation || 1;

    const dims = getEffectiveDimensions(img, orientation);
    let imgW = dims.width, imgH = dims.height;

    // Apply image scaling
    const scaleCfg = config.scale || {};
    let scaleFactor = 1;
    if (scaleCfg.enabled) {
      const targetW = parseInt(scaleCfg.width) || imgW;
      const targetH = parseInt(scaleCfg.height) || imgH;
      if (targetW > 0 && targetH > 0 && (targetW !== imgW || targetH !== imgH)) {
        scaleFactor = Math.min(targetW / imgW, targetH / imgH);
        imgW = Math.round(imgW * scaleFactor);
        imgH = Math.round(imgH * scaleFactor);
      }
    }

    // Calculate border
    const borderCfg = config.border || {};
    let border;
    if (borderCfg.mode === 'aspect_ratio') {
      border = BorderMath.calculateAspectRatio(imgW, imgH, borderCfg.auto_param || 'c', borderCfg.a, borderCfg.b, borderCfg.c);
    } else if (borderCfg.mode === 'target_ratio') {
      border = BorderMath.calculateTargetRatio(imgW, imgH, borderCfg.target_w || 16, borderCfg.target_h || 9,
        borderCfg.auto_param || 'c', borderCfg.a, borderCfg.b, borderCfg.c);
    } else {
      border = BorderMath.calculateCustom(borderCfg.top, borderCfg.bottom, borderCfg.left, borderCfg.right);
    }
    border.color = borderCfg.color || '#FFFFFF';

    const finalW = imgW + border.left + border.right;
    const finalH = imgH + border.top + border.bottom;

    // Check canvas size limits
    const MAX_CANVAS = 16384;
    if (finalW > MAX_CANVAS || finalH > MAX_CANVAS) {
      throw new Error(`Image too large: ${finalW}x${finalH}. Maximum supported is ${MAX_CANVAS}x${MAX_CANVAS} pixels.`);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d');

    // Fill border color
    const borderRgb = hexToRgb(border.color);
    ctx.fillStyle = `rgb(${borderRgb.join(',')})`;
    ctx.fillRect(0, 0, finalW, finalH);

    // Step 1: Create an orientation-corrected offscreen canvas.
    // The Image element reports naturalWidth/naturalHeight in un-oriented
    // (storage) order. We apply the EXIF orientation transform to produce
    // a correctly-oriented source image.
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const needsOrient = orientation > 1;

    const orientCanvas = document.createElement('canvas');
    const orientDims = getEffectiveDimensions(img, orientation);
    orientCanvas.width = orientDims.width;
    orientCanvas.height = orientDims.height;
    const orientCtx = orientCanvas.getContext('2d');
    applyOrientation(orientCtx, img, orientation);
    orientCtx.drawImage(img, 0, 0);
    // Reset transform so subsequent draws are identity-based
    orientCtx.setTransform(1, 0, 0, 1, 0, 0);

    // Step 2: If scaling is enabled, scale the oriented image.
    let sourceCanvas = orientCanvas;
    if (scaleFactor !== 1) {
      const scaleCanvas = document.createElement('canvas');
      scaleCanvas.width = imgW;
      scaleCanvas.height = imgH;
      const scaleCtx = scaleCanvas.getContext('2d');
      scaleCtx.drawImage(orientCanvas, 0, 0, orientDims.width, orientDims.height, 0, 0, imgW, imgH);
      sourceCanvas = scaleCanvas;
    }

    // Step 3: Draw onto main canvas at the border offset
    ctx.drawImage(sourceCanvas, border.left, border.top);

    // Draw logos
    if (config.logos && config.logos.length) {
      await drawLogos(ctx, config.logos, border, finalW, finalH);
    }

    // Draw text
    const globalTextCfg = {
      line_spacing: config.line_spacing || 1.3,
      text_margin_left: config.text_margin_left || 40,
      text_margin_right: config.text_margin_right || 40,
      text_margin_bottom: config.text_margin_bottom || 30,
      text_lines_spacing: config.text_lines_spacing || 8,
      text_vertical_align: config.text_vertical_align || 'baseline',
    };

    if (config.text_lines && config.text_lines.length) {
      await ensureFontsLoaded(config.text_lines);
      drawTextOverlays(ctx, imgW, imgH, border, config.text_lines, globalTextCfg, exif);
    }

    // Preview downscale
    if (maxDim && Math.max(finalW, finalH) > maxDim) {
      const ratio = maxDim / Math.max(finalW, finalH);
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = Math.round(finalW * ratio);
      previewCanvas.height = Math.round(finalH * ratio);
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      return previewCanvas;
    }

    return canvas;
  }

  async function renderPreview(imageData, config, maxDim) {
    maxDim = maxDim || 900;
    return await renderCanvas(imageData, config, maxDim);
  }

  async function renderFull(imageData, config) {
    return await renderCanvas(imageData, config, null);
  }

  async function renderAll(imagesData, config, onProgress) {
    const results = [];
    for (let i = 0; i < imagesData.length; i++) {
      if (onProgress) onProgress(i, imagesData.length, imagesData[i].filename);
      try {
        const canvas = await renderFull(imagesData[i], config);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        results.push({ filename: `rendered_${imagesData[i].filename}`, blob, error: null });
      } catch (e) {
        results.push({ filename: imagesData[i].filename, blob: null, error: e.message });
      }
      // Yield to event loop
      await new Promise(r => setTimeout(r, 0));
    }
    return results;
  }

  return { renderPreview, renderFull, renderAll, loadImage };
})();
