/* App state, navigation, localStorage persistence, image/logo management */

const AppState = (function () {
  const DEFAULT_CONFIG = {
    border: {
      mode: 'target_ratio', top: 0, bottom: 500, left: 0, right: 0,
      color: '#FFFFFF', auto_param: 'b', a: 0, b: 0, c: 500,
      target_w: 16, target_h: 9,
    },
    logos: [],
    text_lines: [
      {
        left: { text: '', font_family: 'Roboto', font_size: 140, font_color: '#333333', font_weight: 'bold', font_style: 'normal' },
        center: { text: '{Focal Length}   {Aperture}   {Exposure Time}   {ISO}', font_family: 'Roboto', font_size: 120, font_color: '#333333', font_weight: 'normal', font_style: 'normal' },
        right: { text: '', font_family: 'Roboto', font_size: 140, font_color: '#333333', font_weight: 'bold', font_style: 'normal' },
      },
    ],
    line_spacing: 1.3,
    text_margin_left: 700,
    text_margin_right: 200,
    text_margin_bottom: 170,
    text_lines_spacing: 8,
    scale: { enabled: true, width: 4000, height: 6000 },
  };

  let _state = {
    images: [],
    config: null,
    currentStep: 1,
  };

  function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
      if (key in result && typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key]) &&
          typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
        result[key] = deepMerge(result[key], override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem('exifBorderConfig');
      if (raw) {
        const parsed = JSON.parse(raw);
        _state.config = deepMerge(DEFAULT_CONFIG, parsed);
      } else {
        _state.config = deepMerge(DEFAULT_CONFIG, {});
      }
    } catch (e) {
      _state.config = deepMerge(DEFAULT_CONFIG, {});
    }
    return _state.config;
  }

  function saveConfig(config) {
    if (config) _state.config = config;
    try {
      localStorage.setItem('exifBorderConfig', JSON.stringify(_state.config));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  }

  function navigate(step) {
    if (step < 1 || step > 3) return;
    if (step >= 2 && _state.images.length === 0) {
      alert('Please select at least one image first.');
      return;
    }
    _state.currentStep = step;
    window.location.hash = 'step' + step;
    showStep(step);
    if (step === 2 && typeof initStep2 === 'function') initStep2();
    if (step === 3 && typeof initStep3 === 'function') initStep3();
  }

  function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.style.display = 'none');
    const section = document.getElementById('step' + step);
    if (section) section.style.display = 'block';

    document.querySelectorAll('.step-link').forEach(link => {
      const linkStep = parseInt(link.dataset.step);
      link.classList.toggle('active', linkStep === step);
    });
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'step1';
    const stepMap = { step1: 1, step2: 2, step3: 3 };
    const step = stepMap[hash] || 1;
    if (_state.currentStep !== step) {
      _state.currentStep = step;
      showStep(step);
      if (step === 2 && typeof initStep2 === 'function') initStep2();
      if (step === 3 && typeof initStep3 === 'function') initStep3();
    }
  }

  async function addImages(fileList) {
    const newImages = [];
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      const exif = await ExifReader.readExif(file);
      const img = await ImageRenderer.loadImage(url);
      const orientation = exif.orientation || 1;
      let width = img.naturalWidth, height = img.naturalHeight;
      if (orientation >= 5 && orientation <= 8) {
        [width, height] = [height, width];
      }
      newImages.push({ file, url, exif, filename: file.name, width, height, orientation });
    }
    _state.images = newImages;
    return newImages;
  }

  function removeImage(filename) {
    const idx = _state.images.findIndex(i => i.filename === filename);
    if (idx >= 0) {
      URL.revokeObjectURL(_state.images[idx].url);
      _state.images.splice(idx, 1);
    }
  }

  function clearAll() {
    for (const img of _state.images) {
      URL.revokeObjectURL(img.url);
    }
    _state.images = [];
  }

  async function addLogo(file) {
    if (!file) return null;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await ImageRenderer.loadImage(dataUrl);
    return {
      filename: file.name,
      dataUrl: dataUrl,
      path: dataUrl,
      width: img.naturalWidth || 400,
      height: img.naturalHeight || 400,
      offset_x: 200,
      offset_y: 60,
    };
  }

  function init() {
    loadConfig();
    window.addEventListener('hashchange', handleHashChange);
    const hash = window.location.hash.replace('#', '') || 'step1';
    const stepMap = { step1: 1, step2: 2, step3: 3 };
    _state.currentStep = stepMap[hash] || 1;
    showStep(_state.currentStep);
    if (_state.currentStep === 3 && typeof initStep3 === 'function') {
      setTimeout(() => initStep3(), 100);
    }
  }

  return {
    get images() { return _state.images; },
    get config() { return _state.config; },
    get currentStep() { return _state.currentStep; },
    loadConfig,
    saveConfig,
    navigate,
    addImages,
    removeImage,
    clearAll,
    addLogo,
    init,
    handleHashChange,
  };
})();
