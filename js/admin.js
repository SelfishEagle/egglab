// ═══════════════════════════════════════════════════
//  Admin Panel
// ═══════════════════════════════════════════════════

let _adminTab = 'products';
let _editingProduct = null;

async function initAdmin() {
  await currency_init();
  renderNav('admin');
  const session = await auth_getSession();
  session ? showDashboard() : showLogin();
}

// ── AUTH ──────────────────────────────────────────
function showLogin() {
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}
function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
  switchTab(_adminTab);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-err');
  const btn   = document.getElementById('login-btn');
  errEl.style.display = 'none';
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    await auth_signIn(email, pass);
    showDashboard();
  } catch {
    errEl.textContent = 'Invalid email or password.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function doLogout() {
  await auth_signOut();
  showLogin();
}

// ── TABS ──────────────────────────────────────────
function switchTab(tab) {
  _adminTab = tab;
  ['products','orders','setup'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`tab-${t}-content`).style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'products') loadAdminProducts();
  if (tab === 'orders')   loadAdminOrders();
}

// ── PRODUCTS ──────────────────────────────────────
async function loadAdminProducts() {
  const el = document.getElementById('admin-products-grid');
  el.innerHTML = '<div class="loading"><span class="spinner"></span>Loading products…</div>';
  try {
    renderAdminProducts(await db_getProducts());
  } catch (e) {
    el.innerHTML = `<div class="err-box">Failed to load: ${esc(e.message)}</div>`;
  }
}

function renderAdminProducts(products) {
  const el = document.getElementById('admin-products-grid');
  if (!products.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">✨</div><p>No products yet. Add your first!</p></div>';
    return;
  }
  el.innerHTML = products.map(p => `
    <div class="ap-card">
      <div class="ap-img">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" onerror="this.style.display='none'">` : '✨'}
      </div>
      <div class="ap-body">
        <div class="ap-name">${esc(p.name)}</div>
        <div class="ap-meta">
          <span style="color:var(--brown);font-weight:700">${fmtPrice(p.price)}</span>
          <span style="color:#9a7050">Stock: ${p.stock}</span>
          <span style="color:var(--amber)">${esc(p.category||'')}</span>
        </div>
        <div class="ap-actions">
          <button class="ap-edit" onclick='openProductModal(${JSON.stringify(JSON.stringify(p))})'>✏️ Edit</button>
          <button class="ap-del"  onclick="deleteProduct('${p.id}','${esc(p.name)}')">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try { await db_deleteProduct(id); loadAdminProducts(); }
  catch (e) { alert('Failed to delete: ' + e.message); }
}

// ── MODAL ─────────────────────────────────────────
function openProductModal(productJson) {
  _editingProduct = productJson ? JSON.parse(productJson) : null;
  const p = _editingProduct;
  document.getElementById('modal-title').textContent   = p ? 'Edit Product' : 'Add New Product';
  document.getElementById('pm-name').value             = p?.name         || '';
  document.getElementById('pm-desc').value             = p?.description  || '';
  document.getElementById('pm-price').value            = p?.price        || '';
  document.getElementById('pm-stock').value            = p?.stock        || '';
  document.getElementById('pm-cat').value              = p?.category     || '';
  document.getElementById('pm-img-url').value          = p?.image_url    || '';
  const prev = document.getElementById('pm-img-preview');
  prev.src = p?.image_url || '';
  prev.style.display = p?.image_url ? 'block' : 'none';
  document.getElementById('pm-img-file').value = '';
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
  _editingProduct = null;
}

function previewImgUrl() {
  const url  = document.getElementById('pm-img-url').value.trim();
  const prev = document.getElementById('pm-img-preview');
  if (url) { prev.src = url; prev.style.display = 'block'; }
  else      { prev.style.display = 'none'; }
}

function handleImageUpload(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('pm-img-preview');
    prev.src = e.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function saveProduct() {
  const name     = document.getElementById('pm-name').value.trim();
  const desc     = document.getElementById('pm-desc').value.trim();
  const price    = parseFloat(document.getElementById('pm-price').value);
  const stock    = parseInt(document.getElementById('pm-stock').value);
  const category = document.getElementById('pm-cat').value.trim();
  const imgUrl   = document.getElementById('pm-img-url').value.trim();
  const imgFile  = document.getElementById('pm-img-file').files[0];
  const btn      = document.getElementById('modal-save-btn');

  if (!name || isNaN(price) || isNaN(stock)) {
    alert('Please fill in at least: name, price, and stock quantity.'); return;
  }

  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    let image_url = imgUrl || _editingProduct?.image_url || null;
    if (imgFile) image_url = await db_uploadImage(imgFile);

    const payload = { name, description: desc, price, stock, category, image_url };
    if (_editingProduct) { await db_updateProduct(_editingProduct.id, payload); }
    else                 { await db_insertProduct(payload); }
    closeProductModal();
    loadAdminProducts();
  } catch (e) {
    alert('Failed to save: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Save Product';
  }
}

// ── ORDERS ────────────────────────────────────────
async function loadAdminOrders() {
  const el = document.getElementById('orders-tbody');
  el.innerHTML = '<tr><td colspan="7" class="loading"><span class="spinner"></span>Loading orders…</td></tr>';
  try {
    renderAdminOrders(await db_getAllOrders());
  } catch (e) {
    el.innerHTML = `<tr><td colspan="7"><div class="err-box">Failed: ${esc(e.message)}</div></td></tr>`;
  }
}

function renderAdminOrders(orders) {
  const el = document.getElementById('orders-tbody');
  if (!orders.length) {
    el.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--tan)">No orders yet.</td></tr>';
    return;
  }
  el.innerHTML = orders.map(o => {
    const items = o.order_items || [];
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:var(--brown)">${esc(o.id)}</td>
        <td><div>${esc(o.customer_name)}</div><div style="font-size:.75rem;color:#9a7050">${esc(o.customer_email)}</div></td>
        <td>${items.length} item${items.length!==1?'s':''}</td>
        <td style="font-weight:700">${fmtPrice(o.total)}</td>
        <td>${fmtDate(o.created_at)}</td>
        <td>${statusPill(o.status)}</td>
        <td>
          <select class="status-select" onchange="updateStatus('${o.id}',this.value)">
            ${['Processing','Shipped','Delivered','Cancelled'].map(s =>
              `<option${s===o.status?' selected':''}>${s}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateStatus(id, status) {
  try { await db_updateOrderStatus(id, status); }
  catch (e) { alert('Failed: ' + e.message); loadAdminOrders(); }
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

document.addEventListener('DOMContentLoaded', initAdmin);
