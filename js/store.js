// ═══════════════════════════════════════════════════
//  Store Page
// ═══════════════════════════════════════════════════

let _allProducts = [];
let _activeCategory = 'All';

async function initStore() {
  await currency_init();
  renderNav('store');
  await loadProducts();
}

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<div class="loading" style="grid-column:1/-1"><span class="spinner"></span>Loading collection…</div>';
  try {
    _allProducts = await db_getProducts();
    renderCategoryFilter();
    renderGrid(_allProducts);
  } catch (e) {
    grid.innerHTML = `<div class="err-box" style="grid-column:1/-1">Could not load products. Check your Supabase config in js/config.js.<br><small>${esc(e.message)}</small></div>`;
  }
}

function renderCategoryFilter() {
  const cats = ['All', ...new Set(_allProducts.map(p => p.category).filter(Boolean))];
  document.getElementById('cat-filter').innerHTML = cats.map(c =>
    `<button class="cat-btn${c===_activeCategory?' active':''}" onclick="setCategory('${esc(c)}')">${esc(c)}</button>`
  ).join('');
}

function setCategory(cat) {
  _activeCategory = cat;
  renderCategoryFilter();
  renderGrid(cat === 'All' ? _allProducts : _allProducts.filter(p => p.category === cat));
}

function renderGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!products.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✨</div><p>No products in this category yet.</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="p-img">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : '✨'}
      </div>
      <div class="p-body">
        <div class="p-cat">${esc(p.category||'')}</div>
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-desc">${esc(p.description||'')}</div>
        <div class="p-footer">
          <div>
            <div class="p-price">${fmtPriceEl(p.price)}</div>
            <div class="p-stock">${p.stock>0?`${p.stock} in stock`:'Out of stock'}</div>
          </div>
          <button class="add-btn" ${p.stock===0?'disabled':''} onclick='addToCart(${JSON.stringify(JSON.stringify({id:p.id,name:p.name,price:p.price,image_url:p.image_url}))})'>
            ${p.stock===0?'Sold out':'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(productJson) {
  const p = JSON.parse(productJson);
  cart_add(p);
  showToast(`"${p.name}" added to cart ✨`);
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: 'toast' });
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--brown);color:var(--cream);padding:.75rem 1.5rem;border-radius:50px;font-size:.88rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2600);
}

document.addEventListener('DOMContentLoaded', initStore);
