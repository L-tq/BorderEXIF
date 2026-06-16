/* EXIF reader for JPEG files in the browser — uses exifr library */

const ExifReader = (function () {
  const EXIF_TAG_IDS = {
    Make: 0x010f,
    Model: 0x0110,
    Software: 0x0131,
    DateTime: 0x0132,
    Artist: 0x013b,
    ExposureTime: 0x829a,
    FNumber: 0x829d,
    ISOSpeedRatings: 0x8827,
    FocalLength: 0x920a,
    LensMake: 0xa433,
    LensModel: 0xa434,
  };

  function emptyExifData(error) {
    return {
      camera_make: '',
      camera_model: '',
      software: '',
      datetime: '',
      artist: '',
      exposure_time: '',
      fnumber: '',
      iso: '',
      focal_length: '',
      lens_make: '',
      lens_model: '',
      aperture: '',
      gps: '',
      image_width: 0,
      image_height: 0,
      all_tags: {},
      error: error || null,
    };
  }

  function formatExposureTime(value) {
    if (value == null) return '';
    const v = parseFloat(value);
    if (isNaN(v)) return '';
    if (v >= 1) return `${v.toFixed(0)}s`;
    const denom = Math.round(1 / v);
    return `1/${denom}s`;
  }

  function formatFNumber(value) {
    if (value == null) return '';
    const v = parseFloat(value);
    if (isNaN(v)) return '';
    return `f/${v.toFixed(1)}`;
  }

  function formatFocalLength(value) {
    if (value == null) return '';
    const v = parseFloat(value);
    if (isNaN(v)) return '';
    return `${v.toFixed(0)}mm`;
  }

  function formatISO(value) {
    if (value == null) return '';
    return `ISO ${value}`;
  }

  async function readExif(file) {
    const output = emptyExifData();

    try {
      const tags = await exifr.parse(file, { gps: true, tiff: true, xmp: true, iptc: true });
      if (!tags) return output;

      // Store all tags
      for (const [k, v] of Object.entries(tags)) {
        if (v !== undefined && v !== null && typeof v !== 'object') {
          output.all_tags[k] = String(v);
        } else if (typeof v === 'object' && !Array.isArray(v)) {
          // Skip nested objects for all_tags (like GPS coordinates)
        } else {
          output.all_tags[k] = String(v);
        }
      }

      output.camera_make = tags.Make || '';
      output.camera_model = tags.Model || '';
      output.software = tags.Software || '';
      output.datetime = tags.DateTimeOriginal || tags.CreateDate || tags.ModifyDate || '';
      output.artist = tags.Artist || '';
      output.exposure_time = formatExposureTime(tags.ExposureTime);
      output.fnumber = formatFNumber(tags.FNumber);
      output.iso = formatISO(tags.ISO);
      output.focal_length = formatFocalLength(tags.FocalLength);
      output.lens_make = tags.LensMake || '';
      output.lens_model = tags.LensModel || '';

      // Aperture
      if (tags.FNumber) {
        output.aperture = formatFNumber(tags.FNumber);
      } else if (tags.ApertureValue) {
        output.aperture = `f/${parseFloat(tags.ApertureValue).toFixed(1)}`;
      }

      // GPS
      if (tags.latitude != null && tags.longitude != null) {
        output.gps = `${parseFloat(tags.latitude).toFixed(6)}, ${parseFloat(tags.longitude).toFixed(6)}`;
      }

      // Image dimensions
      if (tags.ImageWidth) output.image_width = parseInt(tags.ImageWidth);
      if (tags.ImageHeight) output.image_height = parseInt(tags.ImageHeight);

      // Orientation for canvas correction
      output.orientation = tags.Orientation || 1;
    } catch (e) {
      output.error = e.message;
    }

    return output;
  }

  return { readExif };
})();
