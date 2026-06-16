/* Border calculation for image framing — ported from src/border.py */

const BorderMath = {
  calculateCustom(top, bottom, left, right) {
    return {
      top: Math.max(0, parseInt(top) || 0),
      bottom: Math.max(0, parseInt(bottom) || 0),
      left: Math.max(0, parseInt(left) || 0),
      right: Math.max(0, parseInt(right) || 0),
    };
  },

  calculateAspectRatio(imgW, imgH, autoParam, a, b, c) {
    if (autoParam === 'a') {
      if (b == null || c == null) throw new Error('b and c are required when auto-calculating a');
      const bVal = parseFloat(b), cVal = parseFloat(c);
      const aVal = imgH === 0 ? 0 : (imgW * (bVal + cVal)) / (2 * imgH);
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else if (autoParam === 'b') {
      if (a == null || c == null) throw new Error('a and c are required when auto-calculating b');
      const aVal = parseFloat(a), cVal = parseFloat(c);
      const bVal = imgW === 0 ? 0 : (2 * aVal * imgH) / imgW - cVal;
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else if (autoParam === 'c') {
      if (a == null || b == null) throw new Error('a and b are required when auto-calculating c');
      const aVal = parseFloat(a), bVal = parseFloat(b);
      const cVal = imgW === 0 ? 0 : (2 * aVal * imgH) / imgW - bVal;
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else {
      throw new Error(`Invalid auto_param: ${autoParam}. Must be a, b, or c.`);
    }
  },

  calculateTargetRatio(imgW, imgH, targetW, targetH, autoParam, a, b, c) {
    if (targetW <= 0 || targetH <= 0) throw new Error('Target aspect ratio dimensions must be positive');

    if (autoParam === 'a') {
      if (b == null || c == null) throw new Error('b and c are required when auto-calculating a');
      const bVal = parseFloat(b), cVal = parseFloat(c);
      const aVal = targetH === 0 ? 0 : (targetW * (imgH + bVal + cVal) / targetH - imgW) / 2.0;
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else if (autoParam === 'b') {
      if (a == null || c == null) throw new Error('a and c are required when auto-calculating b');
      const aVal = parseFloat(a), cVal = parseFloat(c);
      const bVal = targetW === 0 ? 0 : targetH * (imgW + 2 * aVal) / targetW - imgH - cVal;
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else if (autoParam === 'c') {
      if (a == null || b == null) throw new Error('a and b are required when auto-calculating c');
      const aVal = parseFloat(a), bVal = parseFloat(b);
      const cVal = targetW === 0 ? 0 : targetH * (imgW + 2 * aVal) / targetW - imgH - bVal;
      return { top: Math.max(0, Math.floor(bVal)), bottom: Math.max(0, Math.floor(cVal)), left: Math.max(0, Math.floor(aVal)), right: Math.max(0, Math.floor(aVal)) };
    } else {
      throw new Error(`Invalid auto_param: ${autoParam}. Must be a, b, or c.`);
    }
  },

  getFinalDimensions(imgW, imgH, border) {
    return {
      width: imgW + border.left + border.right,
      height: imgH + border.top + border.bottom,
    };
  },

  getImageArea(border) {
    return { x: border.left, y: border.top };
  },
};
