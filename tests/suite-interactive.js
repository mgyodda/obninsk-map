'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createMockEnvironment } = require('./dom-mock');

function runInteractiveSuite(reporter) {
  console.log('\n--- SUITE 5 & 6: Interactive Actions, Toasts & Controls ---');

  const baseDir = path.resolve(__dirname, '..');
  const appJs = fs.readFileSync(path.join(baseDir, 'app.js'), 'utf8');

  // 1. Share detail button
  reporter.testAsync('#share-detail copies URL with hash to clipboard and triggers toast', async () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const shareBtn = env.doc.getElementById('share-detail');
    
    // Nothing selected -> no action
    env.clipboard.content = null;
    shareBtn.dispatchEvent({ type: 'click' });
    assert.strictEqual(env.clipboard.content, null);

    // Select ippe
    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);
    assert.strictEqual(env.eval('selected'), 'ippe');

    // Click share
    shareBtn.dispatchEvent({ type: 'click' });
    await new Promise(r => setTimeout(r, 20));

    assert.strictEqual(env.clipboard.content, 'https://test-obninsk.local/#ippe');
    const toasts = env.doc.getElementById('toast-container').querySelectorAll('.toast');
    assert.ok(toasts.length > 0);
    assert.strictEqual(toasts[toasts.length - 1].textContent, 'Ссылка на предприятие скопирована!');
  });

  // 2. Copy coords button
  reporter.testAsync('Copy coords button copies latitude/longitude and triggers toast', async () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);

    const copyBtn = env.doc.getElementById('detail-content').querySelector('.copy-coords-btn');
    assert.ok(copyBtn);

    env.clipboard.content = null;
    copyBtn.dispatchEvent({ type: 'click' });
    await new Promise(r => setTimeout(r, 20));

    assert.strictEqual(env.clipboard.content, '55.089444, 36.589167');
    const toasts = env.doc.getElementById('toast-container').querySelectorAll('.toast');
    assert.ok(toasts.length > 0);
    assert.strictEqual(toasts[toasts.length - 1].textContent, 'Координаты скопированы!');
  });

  // 3. Clipboard error handling & fallback
  reporter.testAsync('copyToClipboard shows error toast when clipboard API fails or rejects', async () => {
    const env = createMockEnvironment();
    env.sandbox.navigator.clipboard.writeText = () => Promise.reject(new Error('Permission denied'));
    vm.runInContext(appJs, env.sandbox);

    const copyToClipboard = env.eval('copyToClipboard');
    copyToClipboard('test text', 'Успех');
    await new Promise(r => setTimeout(r, 20));

    const toasts = env.doc.getElementById('toast-container').querySelectorAll('.toast');
    assert.ok(toasts.length > 0);
    assert.strictEqual(toasts[toasts.length - 1].textContent, 'Не удалось скопировать');
  });

  // 4. Verification that map initializes cleanly without geolocation listeners or locate button
  reporter.test('Map initializes cleanly without #locate-btn or geolocation listeners', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    assert.strictEqual(env.doc.getElementById('locate-btn'), null, '#locate-btn should not be present in DOM');
    assert.strictEqual(env.eval('typeof userMarker'), 'undefined', 'userMarker should not exist in scope');

    assert.ok(env.mapInstances.length > 0, 'Leaflet map instance was not created');
    const map = env.mapInstances[0];
    assert.strictEqual(map.eventListeners.has('locationfound'), false, 'locationfound listener should not be registered');
    assert.strictEqual(map.eventListeners.has('locationerror'), false, 'locationerror listener should not be registered');
  });

  // 5. Toast re-parenting inside modal dialogs
  reporter.test('showToast attaches container inside active modal dialog (lightbox / detailWindow)', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const showToast = env.eval('showToast');
    const toastContainer = env.doc.getElementById('toast-container');
    const detailWindow = env.doc.getElementById('detail-window');
    const lightbox = env.doc.getElementById('lightbox');

    // Normal mode: container is in body
    showToast('Тест 1');
    assert.strictEqual(toastContainer.parentElement, env.doc.body);

    // detailWindow open: container moves inside detailWindow
    detailWindow.open = true;
    showToast('Тест 2');
    assert.strictEqual(toastContainer.parentElement, detailWindow);
    detailWindow.open = false;

    // lightbox open: container moves inside lightbox
    lightbox.open = true;
    showToast('Тест 3');
    assert.strictEqual(toastContainer.parentElement, lightbox);
  });

  // 6. Reset view button
  reporter.test('#reset-view-btn invokes overview() resetting map and closing detail', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);
    assert.strictEqual(env.eval('selected'), 'ippe');

    const resetBtn = env.doc.getElementById('reset-view-btn');
    resetBtn.dispatchEvent({ type: 'click' });

    assert.strictEqual(env.eval('selected'), null);
    assert.strictEqual(env.doc.getElementById('detail').hidden, true);
    const map = env.mapInstances[0];
    assert.ok(map.fittedBounds !== null);
  });

  // 7. Fullscreen button (targets document.documentElement)
  reporter.test('#fullscreen-btn toggles fullscreen on document.documentElement', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const fsBtn = env.doc.getElementById('fullscreen-btn');
    
    // Enter fullscreen
    fsBtn.dispatchEvent({ type: 'click' });
    assert.ok(env.doc.fullscreenElement !== null);

    // Exit fullscreen
    fsBtn.dispatchEvent({ type: 'click' });
    assert.strictEqual(env.doc.fullscreenElement, null);
  });

  // 8. Expand detail modal
  reporter.test('#expand-detail moves detail into detail-window and back on collapse', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);

    const expandBtn = env.doc.getElementById('expand-detail');
    const detail = env.doc.getElementById('detail');
    const detailWindow = env.doc.getElementById('detail-window');

    // Expand
    expandBtn.dispatchEvent({ type: 'click' });
    assert.strictEqual(detailWindow.open, true);
    assert.strictEqual(detail.parentElement, detailWindow);

    // Collapse
    expandBtn.dispatchEvent({ type: 'click' });
    assert.strictEqual(detailWindow.open, false);
  });

  // 9. Touch gestures on .detail-top
  reporter.testAsync('Swipe down > 75px on .detail-top triggers slide animation and closes detail after 300ms', async () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);
    assert.strictEqual(env.eval('selected'), 'ippe');

    const detail = env.doc.getElementById('detail');
    const top = env.doc.querySelector('.detail-top');
    top.dispatchEvent({ type: 'touchstart', touches: [{ clientY: 100 }] });
    top.dispatchEvent({ type: 'touchmove', touches: [{ clientY: 200 }] });
    top.dispatchEvent({ type: 'touchend' });

    // Immediately after touchend: slide animation set
    assert.strictEqual(detail.style.transform, 'translateY(100%)');

    // After animation finishes (> 300ms)
    await new Promise(r => setTimeout(r, 350));
    assert.strictEqual(env.eval('selected'), null);
    assert.strictEqual(detail.hidden, true);
  });

  reporter.test('Swipe down <= 75px on .detail-top preserves detail open', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);

    const top = env.doc.querySelector('.detail-top');
    top.dispatchEvent({ type: 'touchstart', touches: [{ clientY: 100 }] });
    top.dispatchEvent({ type: 'touchmove', touches: [{ clientY: 140 }] });
    top.dispatchEvent({ type: 'touchend' });

    assert.strictEqual(env.eval('selected'), 'ippe');
    assert.strictEqual(env.doc.getElementById('detail').hidden, false);
  });

  reporter.test('touchcancel on .detail-top cancels swipe and keeps detail open', () => {
    const env = createMockEnvironment();
    vm.runInContext(appJs, env.sandbox);

    const ippe = env.sandbox.window.PLACES.find(x => x.id === 'ippe');
    const openPlace = env.eval('openPlace');
    openPlace(ippe, true);

    const detail = env.doc.getElementById('detail');
    const top = env.doc.querySelector('.detail-top');
    top.dispatchEvent({ type: 'touchstart', touches: [{ clientY: 100 }] });
    top.dispatchEvent({ type: 'touchmove', touches: [{ clientY: 250 }] });
    top.dispatchEvent({ type: 'touchcancel' });

    assert.strictEqual(detail.style.transform, '');
    assert.strictEqual(env.eval('selected'), 'ippe');
    assert.strictEqual(detail.hidden, false);
  });

  // 10. Leaflet fallback
  reporter.test('Missing Leaflet displays #map-error without crashing', () => {
    const noLEnv = createMockEnvironment({ noLeaflet: true });
    assert.doesNotThrow(() => vm.runInContext(appJs, noLEnv.sandbox));
    const mapError = noLEnv.doc.getElementById('map-error');
    assert.strictEqual(mapError.hidden, false);
    assert.ok(mapError.textContent.includes('Не удалось загрузить карту'));
  });
}

module.exports = { runInteractiveSuite };
