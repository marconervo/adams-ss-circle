import { bounds, validatePrime, homotopyDegree, fundamentalTower } from './module.js';

const $ = id => document.getElementById(id);
let worker, result, started;
let colors = {};

function productControls(prime) {
  // Use exactly the filtration-one products provided by the upstream engine.
  const products = prime === 2 ? ['h_0', 'h_1', 'h_2'] : ['a_0', 'h_0'];
  colors = Object.fromEntries(products.map((name, i) => [name, ['#64748b', '#177f73', '#b57524'][i]]));
  document.querySelector('.legend').replaceChildren(...products.map(name => {
    const label = document.createElement('label');
    const input = Object.assign(document.createElement('input'), { type: 'checkbox', checked: true });
    input.dataset.product = name; input.onchange = draw;
    const span = document.createElement('span');
    span.textContent = name.replace('_0', '₀').replace('_1', '₁').replace('_2', '₂');
    span.style.color = colors[name];
    label.append(input, span); return label;
  }));
}

function status(text, error = false) {
  $('status').textContent = text;
  $('status').hidden = !text;
  $('status').classList.toggle('error', error);
}
function busy(value) {
  for (const id of ['compute', 'prime', 'k', 'range', 'filtration']) $(id).disabled = value;
  $('stop').hidden = !value;
}
function finish() {
  worker?.terminate(); worker = null;
  busy(false);
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('settings').addEventListener('submit', event => {
  event.preventDefault(); finish();
  const k = Number($('k').value), range = Number($('range').value);
  const filtration = Number($('filtration').value);
  try {
    const prime = validatePrime(Number($('prime').value));
    const limits = bounds(k, range, filtration);
    productControls(prime);
    result = { format: 2, prime, k, range, limits, page: 2,
      description: `Ext_A(H*(Sp^(${prime}^k)),F${prime}); q = t-s-2k+1; no differentials computed`,
      engine: 'SpectralSequences/sseq + filtration/dimension-check adapter; see vendor/NOTICE.md',
      fundamentalGroup: { q: 1, group: 'Z', completion: `Z_${prime}`,
        source: k === 0 ? 'computed-sphere-tower' : 'explicit-Z-factor',
        tower: fundamentalTower(k, limits.filtration) },
      module: null, classes: [], products: [], complete: false };
    $('json').disabled = $('svg').disabled = true;
    $('module').disabled = true;
    $('chart').innerHTML = '<p class="empty" role="status">Computing the minimal resolution…</p>';
    started = performance.now(); busy(true);
    status('');
    worker = new Worker('./worker.js');
    const fail = message => {
      finish(); result.complete = false;
      status(`Calculation failed: ${message}`, true);
      $('chart').innerHTML = '<p class="empty">No completed result. Try a smaller range.</p>';
    };
    worker.onerror = event => fail(event.message || 'The worker could not load.');
    worker.onmessage = ({ data }) => {
      if (data.error) { fail(data.error); return; }
      if (data.module) { result.module = data.module; $('module').disabled = false; }
      if (data.AddClass?.num) {
        const { b: { coords: [stem, s] }, num } = data.AddClass;
        result.classes.push({ stem, s, t: stem + s, q: homotopyDegree(stem, k), dimension: num });
      }
      if (data.AddProduct?.product.some(row => row.some(Boolean))) {
        const { source_b, mult_b, name, product } = data.AddProduct;
        result.products.push({ source: source_b.coords, shift: mult_b.coords, name, matrix: product });
      }
      if (data.done) {
        result.complete = true;
        result.seconds = (performance.now() - started) / 1000;
        finish(); $('json').disabled = $('svg').disabled = false;
        status('');
        draw();
      }
    };
    worker.postMessage({ prime, k, range, filtration });
  } catch (error) { finish(); status(error.message, true); }
});
$('stop').onclick = () => {
  finish(); result.complete = false;
  status('Stopped. Partial results discarded.');
  $('chart').innerHTML = '<p class="empty">Choose a smaller range or compute again.</p>';
};

function draw() {
  if (!result?.complete) return;
  const { prime, k, range, limits, classes, products } = result;
  const min = 1, max = range;
  const tower = result.fundamentalGroup.tower;
  const visible = [...classes.filter(c => c.q >= (k > 0 ? 2 : min)
    && c.q <= max), ...tower];
  const key = (c, i) => `${c.source || c.stem},${c.s},${i}`;
  const width = Math.max($('chart').clientWidth - 2, 90 + (max - min) * 30);
  const top = limits.filtration;
  const height = 70 + top * 25, dx = (width - 90) / Math.max(1, max - min);
  const x = c => 55 + (c.q - min) * dx, y = s => height - 30 - s * 25;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `Adams E2 at prime ${prime} for Sp^(${prime}^${k}), homotopy degree ${min} to ${max}, filtration 0 to ${top}`);
  const add = (tag, attributes, text) => {
    const node = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    svg.append(node); return node;
  };
  add('rect', { width, height, fill: 'white' });
  const textStyle = { 'font-family': 'system-ui,sans-serif', 'font-size': 11, fill: '#5d6d64' };
  for (let n = min; n <= max; n++) {
    const xx = 55 + (n - min) * dx;
    add('line', { x1: xx, x2: xx, y1: 25, y2: y(0), stroke: '#e9eee8' });
    add('text', { ...textStyle, x: xx, y: y(0) + 21, 'text-anchor': 'middle' }, n);
  }
  for (let s = 0; s <= top; s++) {
    add('line', { x1: 55, x2: width - 35, y1: y(s), y2: y(s), stroke: '#e9eee8' });
    add('text', { ...textStyle, x: 39, y: y(s) + 4, 'text-anchor': 'end' }, s);
  }
  const positions = new Map();
  for (const c of visible) for (let i = 0; i < c.dimension; i++) {
    const offset = (i - (c.dimension - 1) / 2) * Math.min(7, 20 / c.dimension);
    positions.set(key(c, i), [x(c) + offset, y(c.s) - offset]);
  }
  const enabled = new Set([...document.querySelectorAll('[data-product]:checked')].map(el => el.dataset.product));
  if (enabled.has(prime === 2 ? 'h_0' : 'a_0')) for (let s = 1; s < tower.length; s++)
    add('line', { x1: x(tower[s]), x2: x(tower[s]), y1: y(s - 1), y2: y(s), stroke: colors[prime === 2 ? 'h_0' : 'a_0'], 'stroke-width': 1.3 });
  for (const p of products) {
    if (!enabled.has(p.name)) continue;
    const [n, s] = p.source, [dn, ds] = p.shift;
    p.matrix.forEach((row, i) => row.forEach((coefficient, j) => {
      const from = positions.get(`${n},${s},${i}`), to = positions.get(`${n + dn},${s + ds},${j}`);
      if (coefficient && from && to) add('line', { x1: from[0], y1: from[1], x2: to[0], y2: to[1], stroke: colors[p.name], 'stroke-width': 1.3 });
    }));
  }
  for (const c of visible) for (let i = 0; i < c.dimension; i++) {
    const [cx, cy] = positions.get(key(c, i));
    const isZTower = c.source || (k === 0 && c.stem === 0);
    add('circle', { cx, cy, r: 3.3, fill: isZTower ? '#000' : '#203c33' });
  }
  $('chart').replaceChildren(svg);
}
window.addEventListener('resize', draw);
$('json').onclick = () => download(`circle-p${result.prime}-k${result.k}-R${result.range}-s${result.limits.filtration}.json`, JSON.stringify(result, null, 2), 'application/json');
$('module').onclick = () => download(`Sp${result.prime}pow${result.k}-through${result.limits.degree}.json`, JSON.stringify(result.module, null, 2), 'application/json');
$('svg').onclick = () => download(`circle-p${result.prime}-k${result.k}-R${result.range}-s${result.limits.filtration}.svg`, new XMLSerializer().serializeToString($('chart').firstChild), 'image/svg+xml');
$('settings').requestSubmit();
