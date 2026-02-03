var filename = 'test_WeatherWidgetInNav_facilityList';

describe(filename, function () {
  function normalizeFacilityLocation(f) {
    if (!f) return null;
    if (typeof f === 'string') {
      var s = String(f).trim();
      return s ? s : null;
    }

    var city = String(f.serviceCity || f.city || f.facilityCity || '').trim();
    var state = String(f.serviceState || f.state || f.facilityState || '').trim();
    if (!city) return null;
    return state ? (city + ', ' + state) : city;
  }

  function uniqLocations(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var raw = String(arr[i] || '').trim();
      if (!raw) continue;
      var k = raw.toLowerCase();
      if (seen[k]) continue;
      seen[k] = true;
      out.push(raw);
    }
    return out;
  }

  function normalizeFacilityListToLocations(payload) {
    var list;
    if (payload && payload.facilities && payload.facilities.length) list = payload.facilities;
    else if (payload && payload.length) list = payload;
    else list = [];

    var mapped = [];
    for (var i = 0; i < list.length; i++) {
      var loc = normalizeFacilityLocation(list[i]);
      if (loc) mapped.push(loc);
    }
    return uniqLocations(mapped);
  }

  beforeAll(function () {
    if (typeof TestApi !== 'undefined' && TestApi && typeof TestApi.createContext === 'function') {
      this.ctx = TestApi.createContext(filename);
      TestApi.waitForSetup(this.ctx, null, 1, 120);
    }
  });

  afterAll(function () {
    if (typeof TestApi !== 'undefined' && TestApi && typeof TestApi.teardown === 'function' && this.ctx) {
      TestApi.teardown(this.ctx);
    }
  });

  it('normalizes city/state from facility objects', function () {
    expect(normalizeFacilityLocation({ serviceCity: 'Austin', serviceState: 'TX' })).toEqual('Austin, TX');
    expect(normalizeFacilityLocation({ city: 'Paris', state: 'FR' })).toEqual('Paris, FR');
    expect(normalizeFacilityLocation({ facilityCity: 'Tokyo', facilityState: 'JP' })).toEqual('Tokyo, JP');
    expect(normalizeFacilityLocation({ serviceCity: 'Berlin' })).toEqual('Berlin');
  });

  it('filters invalid facilities and trims strings', function () {
    expect(normalizeFacilityLocation(null)).toBeNull();
    expect(normalizeFacilityLocation({})).toBeNull();
    expect(normalizeFacilityLocation('   ')).toBeNull();
    expect(normalizeFacilityLocation(' New York, NY ')).toEqual('New York, NY');
  });

  it('accepts payload forms: array or { facilities: [...] }', function () {
    var a = normalizeFacilityListToLocations([
      { serviceCity: 'A', serviceState: 'AA' },
      { serviceCity: 'B', serviceState: 'BB' },
    ]);
    expect(a).toEqual(['A, AA', 'B, BB']);

    var b = normalizeFacilityListToLocations({
      facilities: [
        { serviceCity: 'C', serviceState: 'CC' },
        'D, DD',
      ],
    });
    expect(b).toEqual(['C, CC', 'D, DD']);
  });

  it('dedupes locations case-insensitively', function () {
    var out = normalizeFacilityListToLocations([
      'New York, NY',
      'new york, ny',
      { serviceCity: 'New York', serviceState: 'NY' },
      'Boston, MA',
    ]);
    expect(out).toEqual(['New York, NY', 'Boston, MA']);
  });
});
