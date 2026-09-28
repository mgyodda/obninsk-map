'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createMockEnvironment } = require('./dom-mock');

function runIntegrationSuite(reporter) {
  console.log('\n--- SUITE 3 & 4: Hash Navigation & Detail Card Generation ---');

  const baseDir = path.resolve(__dirname, '..');
  const appJs = fs.readFileSync(path.join(baseDir, 'app.js'), 'utf8');

  // 1. window.location.hash simulation
  const orgIds = ['ippe', 'technologiya', 'typhoon', 'karpov'];

  for (const id of orgIds) {
    reporter.test(`window.location.hash="#${id}" automatically opens organization card`, () => {
      const env = createMockEnvironment({ hash: `#${id}` });
      vm.runInContext(appJs, env.sandbox);

      assert.strictEqual(env.eval('selected'), id, `selected was not set to ${id}`);
      const detail = env.doc.getElementById('detail');
      assert.strictEqual(detail.hidden, false, `detail card should be visible for ${id}`);
      
      const placeBtn = env.doc.getElementById(`place-${id}`);
      assert.strictEqual(placeBtn.getAttribute('aria-pressed'), 'true', `place button aria-pressed should be true for ${id}`);
    });
  }

  reporter.test('window.location.hash with non-existent id (#unknown-123) leaves card closed without errors', () => {
    const env = createMockEnvironment({ hash: '#unknown-123' });
    assert.doesNotThrow(() => {
      vm.runInContext(appJs, env.sandbox);
    });
    assert.strictEqual(env.eval('selected'), null);
    assert.strictEqual(env.doc.getElementById('detail').hidden, true);
  });

  reporter.test('Empty hash or "#" does not trigger card opening', () => {
    const envEmpty = createMockEnvironment({ hash: '' });
    vm.runInContext(appJs, envEmpty.sandbox);
    assert.strictEqual(envEmpty.eval('selected'), null);
    assert.strictEqual(envEmpty.doc.getElementById('detail').hidden, true);

    const envPound = createMockEnvironment({ hash: '#' });
    vm.runInContext(appJs, envPound.sandbox);
    assert.strictEqual(envPound.eval('selected'), null);
    assert.strictEqual(envPound.doc.getElementById('detail').hidden, true);
  });

  // 2. Detail card generation for all organizations
  const baseEnv = createMockEnvironment();
  vm.runInContext(appJs, baseEnv.sandbox);
  const openPlace = baseEnv.eval('openPlace');
  const escapeHTML = baseEnv.eval('escapeHTML');

  for (const p of baseEnv.sandbox.window.PLACES) {
    reporter.test(`openPlace generates complete and valid content for ${p.id} (${p.name})`, () => {
      openPlace(p, true);

      assert.strictEqual(baseEnv.eval('selected'), p.id);
      const detailContent = baseEnv.doc.getElementById('detail-content');
      const html = detailContent.innerHTML;

      // Essential titles
      assert.ok(html.includes(escapeHTML(p.name)), `Name missing: ${p.name}`);
      assert.ok(html.includes(escapeHTML(p.full)), `Full name missing: ${p.full}`);
      assert.ok(html.includes(escapeHTML(p.category)), `Category missing: ${p.category}`);

      // Year specificity
      if (p.id === 'karpov') {
        assert.ok(html.includes('год основания площадки'), 'karpov must have "год основания площадки"');
      } else if (p.year) {
        assert.ok(html.includes('год основания</span>'), 'Regular org should say "год основания"');
      }

      // Examples
      assert.ok(html.includes(`<strong>${p.examples.length}</strong><span>примера продукции и работ</span>`));
      for (const [title] of p.examples) {
        assert.ok(html.includes(escapeHTML(title)), `Example title missing: ${title}`);
      }

      // Coords copy button
      const copyBtn = detailContent.querySelector('.copy-coords-btn');
      assert.ok(copyBtn, 'Copy coords button missing');
      assert.strictEqual(copyBtn.getAttribute('data-coords'), p.coords.join(', '));

      // External links
      assert.ok(html.includes('https://yandex.ru/maps/?text='), 'Yandex Maps link missing');
      assert.ok(html.includes(escapeHTML(p.site)), 'Official site link missing');
    });
  }

  // 3. Edge Cases
  reporter.test('openPlace with 0 photos displays fallback note without hero button', () => {
    const noPhotoPlace = {
      id: 'mock-no-photo',
      name: 'Без фото',
      full: 'Институт без фото',
      category: 'Наука',
      group: 'Все',
      coords: [55.1, 36.6],
      description: 'Описание',
      directions: ['Тест'],
      examples: [],
      site: 'https://example.com',
      photos: []
    };

    assert.doesNotThrow(() => {
      openPlace(noPhotoPlace, true);
    });

    const html = baseEnv.doc.getElementById('detail-content').innerHTML;
    assert.ok(html.includes('Проверенных фотографий пока нет'), 'Fallback photo note missing');
    assert.strictEqual(baseEnv.doc.getElementById('open-photo'), null, 'Hero button should not exist');
  });

  reporter.test('openPlace with minimal metadata works without throwing', () => {
    const minimal = {
      id: 'mock-minimal',
      name: 'Минимальный',
      full: 'Полное название',
      category: 'Наука',
      group: 'Все',
      coords: [55.1, 36.6],
      description: 'Описание',
      directions: ['Тест'],
      site: 'https://example.com'
    };

    assert.doesNotThrow(() => {
      openPlace(minimal, true);
    });
    assert.strictEqual(baseEnv.eval('selected'), 'mock-minimal');
  });
}

module.exports = { runIntegrationSuite };
