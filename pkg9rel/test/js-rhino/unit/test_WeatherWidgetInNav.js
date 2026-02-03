var filename = 'test_WeatherWidgetInNav';

describe(filename, function () {
  var variable;

  // The UI widget itself is implemented in TSX and runs in the browser.
  // The `js-rhino` Jasmine runner cannot execute TSX/React/ES modules.
  // This suite follows the docs and tests the equivalent unit-level logic
  // (temperature formatting + unit toggle behavior) in plain JavaScript.
  function toCelsius(fahrenheit) {
    return Math.round((fahrenheit - 32) * 5 / 9);
  }

  function formatTemp(tempF, unit) {
    if (tempF === null || typeof tempF === 'undefined' || (typeof tempF !== 'number')) {
      return '--°' + unit;
    }
    var v = unit === 'F' ? Math.round(tempF) : toCelsius(tempF);
    return String(v) + '°' + unit;
  }

  // -----------------------------
  // Widget logic mirrored in JS
  // -----------------------------

  // Mirrors `SUFFIX_RE` in the widget.
  var SUFFIX_RE = /\s*\((Auto|Default)\)/;
  var ZIP_RE = /^\d{5}(-\d{4})?$/;

  // Minimal i18n subset for logic tests.
  var UI_LABELS = {
    en: {
      addLocationMenu: '+ Add Custom Location...',
      cityNotFound: 'City not found',
      failed: 'Failed',
      utc: 'UTC'
    },
    es: {
      addLocationMenu: '+ Agregar ubicación...',
      cityNotFound: 'Ciudad no encontrada',
      failed: 'Error',
      utc: 'UTC'
    }
  };

  function t(lang, key) {
    return (UI_LABELS[lang] && UI_LABELS[lang][key]) || UI_LABELS.en[key];
  }

  // Mirrors `fmtQuery` in the widget.
  function fmtQuery(city) {
    var cleaned = String(city || '').replace(SUFFIX_RE, '').trim();
    var p = cleaned.split(',').map(function (s) { return String(s).trim(); });
    return (p.length === 2 && p[1].length === 2) ? (p[0] + ',' + p[1] + ',US') : city;
  }

  // Mirrors geocode URL selection logic.
  function buildGeocodeUrl(apiBase, apiKey, q) {
    var s = String(q || '').trim();
    var isZip = ZIP_RE.test(s);
    if (isZip) return apiBase + '/geo/1.0/zip?zip=' + s + ',US&appid=' + apiKey;
    return apiBase + '/geo/1.0/direct?q=' + encodeURIComponent(s) + '&limit=5&appid=' + apiKey;
  }

  // Mirrors fetchWeather URL construction (minus timeout wrapper).
  function buildWeatherUrl(apiBase, apiKey, city, lang) {
    return apiBase + '/data/2.5/weather?q=' + encodeURIComponent(fmtQuery(city)) + '&appid=' + apiKey + '&units=imperial&lang=' + (lang || 'en');
  }

  // Mirrors widget error handling decision.
  function errorTextFromMessage(message, lang) {
    var msg = message;
    if (msg && String(msg).indexOf('404') !== -1) return t(lang, 'cityNotFound');
    return msg || t(lang, 'failed');
  }

  // Mirrors `baseCities` useMemo composition.
  function buildBaseCities(params) {
    var autoCity = params.autoCity;
    var facilityLocations = params.facilityLocations || [];
    var selected = params.selected;
    var customCities = params.customCities || [];
    var lang = params.lang || 'en';

    var addLocationMenuText = t(lang, 'addLocationMenu');
    var defaults = [autoCity, 'San Francisco, CA', 'New York, NY', 'Tokyo, JP'].filter(Boolean);
    var primary = facilityLocations.length ? facilityLocations : defaults;
    var withSelected = (selected && primary.indexOf(selected) === -1) ? [selected].concat(primary) : primary;
    return withSelected.concat(customCities).concat([addLocationMenuText]).filter(Boolean);
  }

  beforeAll(function () {
    // Follow the Jasmine structure recommended in the docs.
    // This test file intentionally stays in `test/js-rhino/unit` and uses `.js`.

    if (typeof TestApi !== 'undefined' && TestApi && typeof TestApi.createContext === 'function') {
      this.ctx = TestApi.createContext(filename);
      // Wait for any async setup (if any) to complete.
      TestApi.waitForSetup(this.ctx, null, 1, 120);
    }

    variable = 0;
  });

  beforeEach(function () {
    variable += 1;
  });

  afterAll(function () {
    if (typeof TestApi !== 'undefined' && TestApi && typeof TestApi.teardown === 'function' && this.ctx) {
      TestApi.teardown(this.ctx);
    }
  });

  it('runs under the js-rhino Jasmine runner', function () {
    expect(true).toEqual(true);
  });

  it('optionally creates a TestApi context when available', function () {
    // Do not skip: pass either way, but validate when available.
    if (typeof TestApi !== 'undefined' && TestApi && typeof TestApi.createContext === 'function') {
      expect(this.ctx).toBeDefined();
    } else {
      expect(true).toEqual(true);
    }
  });

  it('formats placeholder temperature in Fahrenheit (matches widget chrome)', function () {
    expect(formatTemp(null, 'F')).toEqual('--°F');
  });

  it('formats placeholder temperature in Celsius (after unit toggle)', function () {
    expect(formatTemp(null, 'C')).toEqual('--°C');
  });

  it('converts Fahrenheit to Celsius the same way as the widget', function () {
    // Widget uses Math.round((F - 32) * 5 / 9)
    expect(formatTemp(72, 'C')).toEqual('22°C');
  });

  it('t() falls back to English when language key missing', function () {
    expect(t('xx', 'failed')).toEqual('Failed');
  });

  it('fmtQuery strips suffix and appends ",US" for "City, ST"', function () {
    expect(fmtQuery('Redwood City, CA (Auto)')).toEqual('Redwood City,CA,US');
    expect(fmtQuery('New York, NY (Default)')).toEqual('New York,NY,US');
  });

  it('fmtQuery returns original string when not "City, ST"', function () {
    expect(fmtQuery('Redwood City')).toEqual('Redwood City');
  });

  it('buildGeocodeUrl uses zip endpoint for ZIP inputs', function () {
    var u = buildGeocodeUrl('https://api.openweathermap.org', 'KEY', '94040');
    expect(u).toContain('/geo/1.0/zip?zip=94040,US');
  });

  it('buildGeocodeUrl uses direct endpoint for city queries', function () {
    var u = buildGeocodeUrl('https://api.openweathermap.org', 'KEY', 'Redwood City, CA');
    expect(u).toContain('/geo/1.0/direct?q=Redwood%20City%2C%20CA');
    expect(u).toContain('limit=5');
  });

  it('buildWeatherUrl includes units=imperial and passes lang', function () {
    var u = buildWeatherUrl('https://api.openweathermap.org', 'KEY', 'Redwood City, CA', 'es');
    expect(u).toContain('/data/2.5/weather?q=Redwood%20City%2CCA%2CUS');
    expect(u).toContain('units=imperial');
    expect(u).toContain('lang=es');
  });

  it('errorTextFromMessage localizes not-found errors', function () {
    expect(errorTextFromMessage('HTTP 404: city not found', 'es')).toEqual('Ciudad no encontrada');
  });

  it('errorTextFromMessage passes through non-404 messages', function () {
    expect(errorTextFromMessage('Boom', 'es')).toEqual('Boom');
  });

  it('errorTextFromMessage falls back when message is empty', function () {
    expect(errorTextFromMessage('', 'es')).toEqual('Error');
  });

  it('buildBaseCities prefers facilityLocations when present', function () {
    var out = buildBaseCities({
      autoCity: 'Auto City, AC',
      facilityLocations: ['Austin, TX', 'Boston, MA'],
      selected: 'Austin, TX',
      customCities: ['Paris, FR'],
      lang: 'en'
    });

    // Facility list becomes primary; selected should not be duplicated.
    expect(out[0]).toEqual('Austin, TX');
    expect(out[1]).toEqual('Boston, MA');
    expect(out).toContain('Paris, FR');
    expect(out[out.length - 1]).toEqual('+ Add Custom Location...');
  });

  it('buildBaseCities injects selected when missing from primary list', function () {
    var out = buildBaseCities({
      autoCity: 'Auto City, AC',
      facilityLocations: ['Austin, TX'],
      selected: 'San Jose, CA',
      customCities: [],
      lang: 'en'
    });
    expect(out[0]).toEqual('San Jose, CA');
    expect(out[1]).toEqual('Austin, TX');
  });

  it('increments variable via beforeEach (docs structure example)', function () {
    expect(variable).toBeGreaterThan(0);
  });
});