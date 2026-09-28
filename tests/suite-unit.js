'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createMockEnvironment } = require('./dom-mock');

function runUnitSuite(reporter) {
  console.log('--- SUITE 1 & 2: Syntax, Elements & HTML Escaping ---');

  const baseDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(baseDir, 'app.js'), 'utf8');

  // 1. Syntax & Files
  reporter.test('app.js compiles with vm.Script (syntax check)', () => {
    assert.doesNotThrow(() => new vm.Script(appJs));
  });

  reporter.test('data.js compiles with vm.Script', () => {
    const dataJs = fs.readFileSync(path.join(baseDir, 'data.js'), 'utf8');
    assert.doesNotThrow(() => new vm.Script(dataJs));
  });

  reporter.test('photos.js compiles with vm.Script', () => {
    const photosJs = fs.readFileSync(path.join(baseDir, 'photos.js'), 'utf8');
    assert.doesNotThrow(() => new vm.Script(photosJs));
  });

  // 2. Verified removal of #locate-btn and geolocation per user request
  reporter.test('index.html does NOT contain #locate-btn (removed per user request)', () => {
    assert.strictEqual(indexHtml.includes('id="locate-btn"'), false, '#locate-btn should not be present in index.html');
  });

  reporter.test('app.js does NOT reference #locate-btn or geolocation', () => {
    assert.strictEqual(appJs.includes('locate-btn'), false, 'app.js should not reference locate-btn');
    assert.strictEqual(appJs.includes('map.locate'), false, 'app.js should not contain map.locate');
  });

  // 3. Existing required elements
  const requiredElements = [
    { id: 'reset-view-btn', desc: 'Reset view button', handler: "('reset-view-btn')" },
    { id: 'fullscreen-btn', desc: 'Fullscreen button', handler: "('fullscreen-btn')" },
    { id: 'toast-container', desc: 'Toast container', handler: "('toast-container')" },
    { id: 'share-detail', desc: 'Share detail button', handler: "('share-detail')" }
  ];

  for (const el of requiredElements) {
    reporter.test(`index.html contains #${el.id} (${el.desc})`, () => {
      assert.ok(indexHtml.includes(`id="${el.id}"`), `Element #${el.id} missing in index.html`);
    });

    reporter.test(`app.js references and wires #${el.id}`, () => {
      assert.ok(appJs.includes(el.handler), `Wiring for #${el.id} missing in app.js`);
    });
  }

  // 4. HTML Escaping & XSS Safety
  const env = createMockEnvironment();
  vm.runInContext(appJs, env.sandbox);
  const escapeHTML = env.eval('escapeHTML');
  const external = env.eval('external');
  const searchText = env.eval('searchText');
  const applyFilters = env.eval('applyFilters');

  reporter.test('escapeHTML escapes all 5 critical chars: & < > " \'', () => {
    const out = escapeHTML('& < > " \'');
    assert.strictEqual(out, '&amp; &lt; &gt; &quot; &#39;');
  });

  reporter.test('escapeHTML neutralizes script tags and XSS payloads', () => {
    const malicious = '<script>alert("PWNED")</script>';
    const safe = escapeHTML(malicious);
    assert.strictEqual(safe, '&lt;script&gt;alert(&quot;PWNED&quot;)&lt;/script&gt;');
    assert.ok(!safe.includes('<script>'));
  });

  reporter.test('escapeHTML neutralizes attribute breakout injections', () => {
    const attrBreak = 'x" onfocus="alert(1)" class=\'evil\'';
    const safe = escapeHTML(attrBreak);
    assert.strictEqual(safe, 'x&quot; onfocus=&quot;alert(1)&quot; class=&#39;evil&#39;');
  });

  reporter.test('escapeHTML handles non-string and empty inputs', () => {
    assert.strictEqual(escapeHTML(1954), '1954');
    assert.strictEqual(escapeHTML(''), '');
  });

  reporter.test('external() generates secured anchor with escaped url and label', () => {
    const link = external('https://site.ru/?a=1&b=2"x', 'Site <Special>');
    assert.strictEqual(
      link,
      '<a href="https://site.ru/?a=1&amp;b=2&quot;x" target="_blank" rel="noopener noreferrer">Site &lt;Special&gt;</a>'
    );
  });

  // 5. Search logic
  reporter.test('searchText extracts all key fields and normalizes ё->е and case', () => {
    const places = env.sandbox.window.PLACES;
    for (const p of places) {
      const txt = searchText(p);
      assert.ok(txt.includes(p.name.toLocaleLowerCase('ru').replace(/ё/g, 'е')));
      assert.ok(txt.includes(p.full.toLocaleLowerCase('ru').replace(/ё/g, 'е')));
      assert.ok(txt.includes(p.category.toLocaleLowerCase('ru').replace(/ё/g, 'е')));
    }
  });

  reporter.test('applyFilters filters places by query and industry group', () => {
    const search = env.doc.getElementById('search');
    
    search.value = 'композит';
    applyFilters();
    assert.strictEqual(env.doc.getElementById('place-technologiya').hidden, false);
    assert.strictEqual(env.doc.getElementById('place-ippe').hidden, true);

    search.value = '';
    applyFilters();
    assert.strictEqual(env.doc.getElementById('place-ippe').hidden, false);
    assert.strictEqual(env.doc.getElementById('place-technologiya').hidden, false);
  });
}

module.exports = { runUnitSuite };
