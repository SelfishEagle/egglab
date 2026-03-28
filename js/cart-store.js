// ═══════════════════════════════════════════════════
//  Cart Store — localStorage + shared nav
// ═══════════════════════════════════════════════════

const CART_KEY = 'egglab_cart';

function cart_get() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function cart_save(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  cart_updateBadge();
}
function cart_add(product) {
  const items = cart_get();
  const ex = items.find(i => i.id === product.id);
  if (ex) { ex.qty += 1; } else { items.push({ ...product, qty: 1 }); }
  cart_save(items);
}
function cart_remove(id)      { cart_save(cart_get().filter(i => i.id !== id)); }
function cart_updateQty(id, qty) {
  if (qty < 1) { cart_remove(id); return; }
  const items = cart_get();
  const item = items.find(i => i.id === id);
  if (item) { item.qty = qty; cart_save(items); }
}
function cart_clear()  { localStorage.removeItem(CART_KEY); cart_updateBadge(); }
function cart_total()  { return cart_get().reduce((s, i) => s + i.price * i.qty, 0); }
function cart_count()  { return cart_get().reduce((s, i) => s + i.qty, 0); }
function cart_updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const n = cart_count();
  badge.textContent = n;
  badge.style.display = n > 0 ? 'inline-flex' : 'none';
}

// ═══════════════════════════════════════════════════
//  Absolute URL helper — works from any page depth
// ═══════════════════════════════════════════════════

function siteUrl(path) {
  // Build URLs from the origin + repo base path so they work on
  // GitHub Pages (/repo-name/), Cloudflare (/) and localhost alike
  const loc   = window.location;
  const parts = loc.pathname.split('/').filter(Boolean);

  // Detect GitHub Pages sub-path: pathname looks like /repo-name/...
  // If the first segment has no dot (not a file) it's likely the repo base
  let base = '/';
  if (parts.length > 0 && !parts[0].includes('.')) {
    // Check if we're on github.io or similar subdirectory host
    if (loc.hostname.endsWith('github.io') || loc.hostname.endsWith('pages.dev')) {
      base = '/' + parts[0] + '/';
    }
  }

  return base + path.replace(/^\//, '');
}

// ═══════════════════════════════════════════════════
//  Shared Nav
// ═══════════════════════════════════════════════════

function renderNav(activePage) {
  const el = document.getElementById('navbar');
  if (!el) return;
  const n = cart_count();

  // Currency picker — only render if currency.js is loaded
  const pickerHtml = typeof currency_renderPicker === 'function' ? currency_renderPicker() : '';

  el.innerHTML = `
    <nav class="nav">
      <a class="nav-logo" href="${siteUrl('/')}">✨ EggLab <em>Creations</em></a>
      <div class="nav-links">
        <a class="nav-btn${activePage==='store'?' active':''}" href="${siteUrl('/')}">Shop</a>
        <a class="nav-btn${activePage==='track'?' active':''}" href="${siteUrl('/track.html')}">Track Order</a>
        ${pickerHtml}
        <a class="nav-btn nav-cart" href="${siteUrl('/cart.html')}">
          🛒 Cart
          <span id="cart-badge" class="cart-badge" style="display:${n>0?'inline-flex':'none'}">${n}</span>
        </a>
        <a class="nav-btn${activePage==='admin'?' active':''}" href="${siteUrl('/admin/')}">Admin</a>
      </div>
    </nav>
  `;
}

// ═══════════════════════════════════════════════════
//  Utilities
// ═══════════════════════════════════════════════════

function fmtPrice(n) {
  // Use currency converter if loaded, else fall back to AUD
  if (typeof currency_format === 'function') return currency_format(n);
  return `${CONFIG.CURRENCY_SYMBOL}${Number(n).toFixed(2)}`;
}

function fmtPriceEl(n) {
  // Returns an element with data-aud-price so it auto-updates on currency switch
  const formatted = fmtPrice(n);
  return `<span data-aud-price="${n}">${formatted}</span>`;
}

function genOrderId() {
  return 'EGG-' + Math.random().toString(36).substring(2,10).toUpperCase();
}
function statusPill(s) {
  return `<span class="status-pill s-${s}">${s}</span>`;
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getBase() {
  return siteUrl('/');
}
