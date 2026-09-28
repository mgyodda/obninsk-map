// Lightweight DOM Mock for Obninsk-map
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockClassList {
  constructor(el) {
    this.el = el;
    this.classes = new Set();
  }
  add(...names) {
    for (const n of names) if (n) this.classes.add(n);
    this.el._className = Array.from(this.classes).join(' ');
  }
  remove(...names) {
    for (const n of names) this.classes.delete(n);
    this.el._className = Array.from(this.classes).join(' ');
  }
  toggle(name, force) {
    if (force === undefined) {
      if (this.classes.has(name)) this.classes.delete(name);
      else this.classes.add(name);
    } else if (force) {
      this.classes.add(name);
    } else {
      this.classes.delete(name);
    }
    this.el._className = Array.from(this.classes).join(' ');
  }
  contains(name) {
    return this.classes.has(name);
  }
}

class MockElement {
  constructor(tagName, doc) {
    this.tagName = tagName.toUpperCase();
    this.doc = doc;
    this.id = '';
    this._className = '';
    this.classList = new MockClassList(this);
    this.attributes = new Map();
    this.dataset = {};
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.hidden = false;
    this.open = false;
    this.disabled = false;
    this.scrollTop = 0;
    this.offsetWidth = 400;
    this.src = '';
    this.alt = '';
    this.value = '';
    this.isConnected = true;
    this.listeners = new Map();
    this._innerHTML = '';
    this._textContent = '';
  }

  get className() { return this._className; }
  set className(val) {
    this._className = val || '';
    this.classList.classes.clear();
    for (const c of this._className.split(/\s+/).filter(Boolean)) {
      this.classList.classes.add(c);
    }
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
    if (name === 'id') {
      this.id = String(val);
      if (this.doc) this.doc.elementsById.set(this.id, this);
    }
    if (name === 'class') this.className = String(val);
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[camel] = String(val);
    }
  }

  getAttribute(name) { return this.attributes.get(name) || null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      delete this.dataset[camel];
    }
  }

  addEventListener(type, handler, opts) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push({ handler, opts });
  }

  removeEventListener(type, handler) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter(x => x !== handler));
  }

  dispatchEvent(evt) {
    const list = this.listeners.get(evt.type) || [];
    for (const item of [...list]) {
      evt.target = evt.target || this;
      evt.currentTarget = this;
      item.handler(evt);
      if (item.opts && item.opts.once) {
        this.removeEventListener(evt.type, item.handler);
      }
    }
  }

  append(...nodes) {
    for (const n of nodes) {
      if (typeof n === 'string') {
        const textNode = new MockElement('#text', this.doc);
        textNode.textContent = n;
        this.children.push(textNode);
      } else {
        if (n.parentNode) n.remove();
        n.parentNode = this;
        n.parentElement = this;
        this.children.push(n);
        if (n.id && this.doc) {
          this.doc.elementsById.set(n.id, n);
        }
      }
    }
  }

  remove() {
    if (this.parentNode) {
      const idx = this.parentNode.children.indexOf(this);
      if (idx !== -1) this.parentNode.children.splice(idx, 1);
      this.parentNode = null;
      this.parentElement = null;
    }
    if (this.id && this.doc) {
      this.doc.elementsById.delete(this.id);
    }
  }

  focus() { if (this.doc) this.doc.activeElement = this; }
  getBoundingClientRect() { return { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 }; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  requestFullscreen() {
    if (this.doc) this.doc.fullscreenElement = this;
    return Promise.resolve();
  }
  insertAdjacentHTML(position, html) { this.innerHTML += html; }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join('');
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(html) {
    const unregister = (node) => {
      if (node.id && this.doc) this.doc.elementsById.delete(node.id);
      for (const child of node.children) unregister(child);
    };
    for (const child of this.children) unregister(child);

    this._innerHTML = String(html);
    this.children = [];
    const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
    let match;
    while ((match = tagRegex.exec(this._innerHTML)) !== null) {
      const tag = match[1];
      if (tag.startsWith('/')) continue;
      const attrStr = match[2];
      const el = new MockElement(tag, this.doc);
      const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr)) !== null) {
        const attrName = aMatch[1];
        const attrVal = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : (aMatch[4] || ''));
        el.setAttribute(attrName, attrVal);
      }
      el.parentNode = this;
      el.parentElement = this;
      this.children.push(el);
      if (el.id && this.doc) {
        this.doc.elementsById.set(el.id, el);
      }
    }
  }

  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    const check = (node) => {
      let matches = false;
      if (sel.startsWith('#')) {
        matches = node.id === sel.slice(1);
      } else if (sel.startsWith('.')) {
        matches = node.classList.contains(sel.slice(1));
      } else if (sel.startsWith('[') && sel.endsWith(']')) {
        const inner = sel.slice(1, -1);
        if (inner.includes('=')) {
          const [k, v] = inner.split('=');
          const cleanV = v.replace(/^["']|["']$/g, '');
          matches = node.getAttribute(k) === cleanV;
        } else {
          matches = node.hasAttribute(inner) || (node.dataset && (inner.replace(/^data-/, '') in node.dataset));
        }
      } else {
        matches = node.tagName.toLowerCase() === sel.toLowerCase();
      }
      if (matches) results.push(node);
      for (const child of node.children) check(child);
    };
    for (const child of this.children) check(child);
    return results;
  }
}
class MockDocument {
  constructor() {
    this.elementsById = new Map();
    this.body = new MockElement('body', this);
    this.documentElement = new MockElement('html', this);
    this.activeElement = null;
    this.fullscreenElement = null;
    this.listeners = new Map();
  }
  getElementById(id) { return this.elementsById.get(id) || null; }
  createElement(tag) { return new MockElement(tag, this); }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter(x => x !== handler));
  }
  dispatchEvent(evt) {
    const list = this.listeners.get(evt.type) || [];
    for (const fn of list) fn(evt);
  }
  exitFullscreen() {
    this.fullscreenElement = null;
    return Promise.resolve();
  }
  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }
  querySelectorAll(sel) {
    const results = [];
    const check = (node) => {
      let matches = false;
      if (sel.startsWith('#')) {
        matches = node.id === sel.slice(1);
      } else if (sel.startsWith('.')) {
        const parts = sel.split(/\s+/);
        if (parts.length > 1) {
          const c2 = parts[1].slice(1);
          const c1 = parts[0].slice(1);
          if (node.classList.contains(c2)) {
            let p = node.parentElement;
            while (p) {
              if (p.classList.contains(c1)) { matches = true; break; }
              p = p.parentElement;
            }
          }
        } else {
          matches = node.classList.contains(sel.slice(1));
        }
      } else if (sel.startsWith('[') && sel.endsWith(']')) {
        const inner = sel.slice(1, -1);
        matches = node.hasAttribute(inner);
      }
      if (matches) results.push(node);
      for (const child of node.children) check(child);
    };
    check(this.body);
    for (const el of this.elementsById.values()) {
      if (!results.includes(el)) check(el);
    }
    return results;
  }
}

function createMockEnvironment(options = {}) {
  const doc = new MockDocument();
  const main = doc.createElement('main');
  main.className = 'workspace';
  doc.body.append(main);

  const detailWindow = doc.createElement('dialog');
  detailWindow.id = 'detail-window';
  doc.body.append(detailWindow);

  const detail = doc.createElement('section');
  detail.id = 'detail';
  detail.hidden = true;
  main.append(detail);

  const detailTop = doc.createElement('div');
  detailTop.className = 'detail-top';
  detail.append(detailTop);

  const shareBtn = doc.createElement('button');
  shareBtn.id = 'share-detail';
  detailTop.append(shareBtn);

  const expandBtn = doc.createElement('button');
  expandBtn.id = 'expand-detail';
  detailTop.append(expandBtn);

  const closeDetailBtn = doc.createElement('button');
  closeDetailBtn.id = 'close-detail';
  detailTop.append(closeDetailBtn);

  const detailContent = doc.createElement('div');
  detailContent.id = 'detail-content';
  detail.append(detailContent);

  const lightbox = doc.createElement('dialog');
  lightbox.id = 'lightbox';
  doc.body.append(lightbox);

  const closePhotoBtn = doc.createElement('button');
  closePhotoBtn.id = 'close-photo';
  lightbox.append(closePhotoBtn);

  const largePhoto = doc.createElement('img');
  largePhoto.id = 'large-photo';
  lightbox.append(largePhoto);

  const prevPhoto = doc.createElement('button');
  prevPhoto.id = 'prev-photo';
  lightbox.append(prevPhoto);

  const nextPhoto = doc.createElement('button');
  nextPhoto.id = 'next-photo';
  lightbox.append(nextPhoto);

  const photoPos = doc.createElement('span');
  photoPos.id = 'photo-position';
  lightbox.append(photoPos);

  const photoCaption = doc.createElement('p');
  photoCaption.id = 'photo-caption';
  lightbox.append(photoCaption);

  const toastContainer = doc.createElement('div');
  toastContainer.id = 'toast-container';
  doc.body.append(toastContainer);

  const countEl = doc.createElement('span');
  countEl.id = 'count';
  doc.body.append(countEl);

  const mapWrap = doc.createElement('section');
  mapWrap.className = 'map-wrap';
  main.append(mapWrap);

  const mapEl = doc.createElement('div');
  mapEl.id = 'map';
  mapWrap.append(mapEl);

  const mapLabel = doc.createElement('div');
  mapLabel.className = 'map-label';
  const muted = doc.createElement('span');
  muted.className = 'muted';
  mapLabel.append(muted);
  mapWrap.append(mapLabel);

  const resetViewBtn = doc.createElement('button');
  resetViewBtn.id = 'reset-view-btn';
  mapWrap.append(resetViewBtn);

  const fullscreenBtn = doc.createElement('button');
  fullscreenBtn.id = 'fullscreen-btn';
  mapWrap.append(fullscreenBtn);

  const mapError = doc.createElement('div');
  mapError.id = 'map-error';
  mapWrap.append(mapError);

  const retryBtn = doc.createElement('button');
  retryBtn.id = 'retry';
  mapWrap.append(retryBtn);

  const overviewBtn = doc.createElement('button');
  overviewBtn.id = 'overview';
  doc.body.append(overviewBtn);

  const placesNav = doc.createElement('nav');
  placesNav.id = 'places';
  doc.body.append(placesNav);

  const searchInput = doc.createElement('input');
  searchInput.id = 'search';
  doc.body.append(searchInput);

  const emptyResults = doc.createElement('div');
  emptyResults.id = 'empty-results';
  doc.body.append(emptyResults);

  const clearSearchBtn = doc.createElement('button');
  clearSearchBtn.id = 'clear-search';
  doc.body.append(clearSearchBtn);

  for (const g of ['Все', 'Ядерные технологии', 'Материаловедение', 'Экология и климат']) {
    const btn = doc.createElement('button');
    btn.setAttribute('data-group', g);
    btn.setAttribute('aria-pressed', g === 'Все' ? 'true' : 'false');
    doc.body.append(btn);
  }

  const clipboard = {
    content: null,
    writeText: async (t) => { clipboard.content = t; }
  };

  const mapInstances = [];
  const markersCreated = [];

  class MockLeafletMap {
    constructor() {
      this.attributionControl = { setPrefix: () => {} };
      this.eventListeners = new Map();
      this.layers = new Set();
      this.currentCenter = null;
      this.currentZoom = null;
      mapInstances.push(this);
    }
    on(type, handler) {
      if (!this.eventListeners.has(type)) this.eventListeners.set(type, []);
      this.eventListeners.get(type).push(handler);
    }
    fire(type, data = {}) {
      const list = this.eventListeners.get(type) || [];
      for (const fn of list) fn(data);
    }
    locate(opts) { this.locateOpts = opts; }
    fitBounds(bounds, opts) { this.fittedBounds = bounds; this.fitOpts = opts; }
    project(coords, zoom) { return { x: coords[0] * 10, y: coords[1] * 10 }; }
    unproject(pt, zoom) { return [pt.x / 10, pt.y / 10]; }
    setView(center, zoom, opts) { this.currentCenter = center; this.currentZoom = zoom; }
    hasLayer(layer) { return this.layers.has(layer); }
    removeLayer(layer) { this.layers.delete(layer); }
    invalidateSize() { this.invalidated = true; }
  }

  class MockMarker {
    constructor(coords, opts) {
      this.coords = coords;
      this.opts = opts;
      this.element = doc.createElement('div');
      this.element.className = opts && opts.icon ? opts.icon.className : 'pin';
      this.listeners = new Map();
      markersCreated.push(this);
    }
    addTo(map) {
      map.layers.add(this);
      const addListeners = this.listeners.get('add') || [];
      for (const fn of addListeners) fn();
      return this;
    }
    bindTooltip() { return this; }
    on(type, handler) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(handler);
    }
    setLatLng(coords) { this.coords = coords; }
    getElement() { return this.element; }
  }

  const mockL = {
    map: () => new MockLeafletMap(),
    marker: (coords, opts) => new MockMarker(coords, opts),
    divIcon: (opts) => opts,
    tileLayer: (url, opts) => {
      const tl = {
        url, opts, listeners: new Map(),
        addTo: (m) => { m.layers.add(tl); return tl; },
        on: (evt, fn) => {
          if (!tl.listeners.has(evt)) tl.listeners.set(evt, []);
          tl.listeners.get(evt).push(fn);
        },
        redraw: () => {}
      };
      return tl;
    },
    control: {
      zoom: () => ({ addTo: () => {} }),
      scale: () => ({ addTo: () => {} }),
      layers: () => ({ addTo: () => {} })
    }
  };

  const safeSetTimeout = (fn, delay) => {
    const t = setTimeout(fn, delay);
    if (t.unref) t.unref();
    return t;
  };

  const sandbox = {
    window: {
      location: {
        origin: 'https://test-obninsk.local',
        pathname: '/',
        hash: options.hash || ''
      },
      navigator: { clipboard },
      matchMedia: (q) => ({ matches: false }),
      ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
      setTimeout: safeSetTimeout,
      clearTimeout: (id) => clearTimeout(id),
      PLACES: null,
      L: options.noLeaflet ? undefined : mockL
    },
    document: doc,
    navigator: { clipboard },
    matchMedia: (q) => ({ matches: false }),
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    setTimeout: safeSetTimeout,
    clearTimeout: (id) => clearTimeout(id),
    console: { log: () => {}, error: () => {}, warn: () => {} },
    L: options.noLeaflet ? undefined : mockL
  };

  sandbox.window.document = doc;
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  const baseDir = path.resolve(__dirname, '..');
  const dataJs = fs.readFileSync(path.join(baseDir, 'data.js'), 'utf8');
  vm.runInContext(dataJs, sandbox);
  const photosJs = fs.readFileSync(path.join(baseDir, 'photos.js'), 'utf8');
  vm.runInContext(photosJs, sandbox);

  return {
    sandbox,
    doc,
    clipboard,
    mapInstances,
    markersCreated,
    eval: (expr) => vm.runInContext(expr, sandbox)
  };
}

module.exports = { createMockEnvironment, MockElement, MockDocument };
