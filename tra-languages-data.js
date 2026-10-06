/* TRA Languages data contract v1. No UI, network dependencies or lesson literals. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TRALanguagesData = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function check(ok, message) { if (!ok) throw new Error(message); }
  function text(value) { return typeof value === 'string' && value.trim().length > 0; }
  function id(value) { return text(value) && /^[a-z]+:[A-Za-z0-9][A-Za-z0-9-]*$/.test(value); }
  // Structural subset used by v1. Registration and meaning still require source review.
  function tag(value) { return text(value) && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value); }
  function version(value) { check(value && value.schemaVersion === 1, 'Unsupported schemaVersion'); }
  function https(value) { return text(value) && /^https:\/\/[^\s/]+\//.test(value); }
  function unique(items, getKey, label) {
    var found = Object.create(null);
    items.forEach(function (item) {
      var key = getKey(item);
      check(text(key) && !found[key], 'Missing or duplicate ' + label + ': ' + key);
      found[key] = item;
    });
    return found;
  }
  function validateCatalog(catalog) {
    version(catalog);
    check(catalog.coverage && catalog.coverage.status === 'seed' && catalog.coverage.complete === false,
      'v1 coverage must explicitly remain an incomplete seed');
    check(text(catalog.coverage.note), 'Missing coverage limitation');
    check(Array.isArray(catalog.sources) && catalog.sources.length > 0, 'Missing sources');
    var sources = unique(catalog.sources, function (s) { return s && s.id; }, 'source');
    catalog.sources.forEach(function (s) {
      check(https(s.url) && text(s.title) && text(s.version) && /^\d{4}-\d{2}-\d{2}$/.test(s.retrievedOn),
        'Invalid source metadata: ' + s.id);
    });
    check(Array.isArray(catalog.entities) && catalog.entities.length > 0, 'Missing entities');
    var entities = unique(catalog.entities, function (e) { return e && e.id; }, 'entity');
    var tags = Object.create(null);
    catalog.entities.forEach(function (e) {
      check(id(e.id) && text(e.name), 'Invalid entity identity');
      check(['language', 'macrolanguage', 'locale', 'dialect', 'accent'].indexOf(e.kind) >= 0, 'Invalid entity kind');
      check(Array.isArray(e.refs) && e.refs.length > 0, 'Missing entity source: ' + e.id);
      e.refs.forEach(function (ref) {
        check(ref && sources[ref.sourceId] && text(ref.record), 'Unresolved source reference: ' + e.id);
      });
      if (e.bcp47 !== null) {
        check(tag(e.bcp47), 'Invalid BCP 47 shape: ' + e.id);
        var key = e.bcp47.toLowerCase();
        check(!tags[key], 'Duplicate BCP 47 tag: ' + key);
        tags[key] = true;
      } else check(e.kind === 'dialect' || e.kind === 'accent', 'Only a sourced dialect/accent may lack a tag');
      if (e.kind === 'language' || e.kind === 'macrolanguage') {
        check(/^[a-z]{2,3}$/.test(e.bcp47), 'Language record needs a primary subtag');
        check(!e.parentId, 'Use macrolanguageId for language membership');
      } else {
        check(id(e.parentId) && entities[e.parentId], 'Missing variety parent: ' + e.id);
        check(e.parentId !== e.id, 'Self-parent: ' + e.id);
        if (e.kind === 'locale') {
          var parent = entities[e.parentId];
          check(['language', 'macrolanguage'].indexOf(parent.kind) >= 0 &&
            e.bcp47.indexOf(parent.bcp47 + '-') === 0, 'Locale must extend its language tag');
        }
      }
      if (e.macrolanguageId) {
        check(e.kind === 'language' && entities[e.macrolanguageId] &&
          entities[e.macrolanguageId].kind === 'macrolanguage', 'Invalid macrolanguage membership');
      }
    });
    catalog.entities.forEach(function (e) {
      var seen = Object.create(null), cursor = e;
      while (cursor) {
        check(!seen[cursor.id], 'Cyclic variety ancestry');
        seen[cursor.id] = true;
        cursor = entities[cursor.parentId || cursor.macrolanguageId];
      }
    });
    return catalog;
  }
  function validateManifest(manifest) {
    version(manifest);
    check(Array.isArray(manifest.packs) && manifest.packs.length > 0, 'No lesson packs');
    unique(manifest.packs, function (p) { return p && p.id; }, 'pack');
    unique(manifest.packs, function (p) { return p && p.path; }, 'pack path');
    manifest.packs.forEach(function (p) {
      check(/^[a-z0-9-]+$/.test(p.id) && text(p.label) && id(p.entityId), 'Invalid pack descriptor');
      check(/^lessons\/[a-z0-9-]+\.json$/.test(p.path), 'Unsafe pack path');
    });
    return manifest;
  }
  function validatePack(pack, descriptor) {
    version(pack);
    check(pack.id === descriptor.id && pack.entityId === descriptor.entityId, 'Pack identity mismatch');
    check(tag(pack.translationLanguage) && (pack.speechTag === null || tag(pack.speechTag)), 'Invalid pack language tags');
    check(pack.provenance && https(pack.provenance.url) && text(pack.provenance.kind) && text(pack.provenance.note),
      'Missing lesson provenance');
    check(Array.isArray(pack.items) && pack.items.length > 0, 'Empty lesson pack');
    pack.items.forEach(function (item) {
      check(Array.isArray(item) && item.length === 2 && text(item[0]) && text(item[1]), 'Invalid lesson item');
    });
    return pack;
  }
  function validateReferences(catalog, manifest, packs) {
    validateCatalog(catalog); validateManifest(manifest);
    var entities = unique(catalog.entities, function (e) { return e.id; }, 'entity');
    manifest.packs.forEach(function (p) {
      check(entities[p.entityId], 'Lesson references unknown catalog entity');
      var pack = validatePack(packs[p.id], p);
      if (pack.speechTag !== null) {
        var locale = catalog.entities.filter(function (e) { return e.bcp47 === pack.speechTag; })[0];
        check(locale && (locale.id === p.entityId || locale.parentId === p.entityId), 'Unlinked speech locale');
      }
      check(catalog.entities.some(function (e) { return e.bcp47 === pack.translationLanguage; }),
        'Uncataloged translation language');
    });
    return true;
  }
  function coverage(catalog) {
    var counts = { language: 0, macrolanguage: 0, locale: 0, dialect: 0, accent: 0 };
    catalog.entities.forEach(function (e) { counts[e.kind]++; });
    return counts;
  }
  function createStore(fetcher, base) {
    base = base || 'data/languages/';
    var cache = Object.create(null);
    function load(path, validate) {
      if (!cache[path]) {
        cache[path] = Promise.resolve().then(function () {
          check(typeof fetcher === 'function', 'This browser cannot load JSON data');
          return fetcher(base + path);
        }).then(function (response) {
          check(response && response.ok, 'Cannot load ' + path);
          return response.json();
        }).then(validate).catch(function (error) {
          delete cache[path]; // A failed request must remain retryable.
          throw error;
        });
      }
      return cache[path];
    }
    function manifest() { return load('lesson-packs.json', validateManifest); }
    return {
      catalog: function () { return load('catalog.json', validateCatalog); },
      manifest: manifest,
      pack: function (packId) {
        return manifest().then(function (m) {
          var descriptor = m.packs.filter(function (p) { return p.id === packId; })[0];
          check(descriptor, 'No lesson pack for ' + packId);
          return load(descriptor.path, function (p) { return validatePack(p, descriptor); });
        });
      }
    };
  }
  return { validateCatalog: validateCatalog, validateManifest: validateManifest, validatePack: validatePack,
    validateReferences: validateReferences, coverage: coverage, createStore: createStore };
}));
