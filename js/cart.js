// ═══════════════════════════════════════════════════
//  Cart Page
// ═══════════════════════════════════════════════════

async function initCart() {
  await currency_init();
  renderNav('cart');
  renderCart();
}

function renderCart() {
  const items = cart_get();
  const listEl = document.getElementById('cart-list');
  const summaryEl = document.getElementById('cart-summary');
  const emptyEl = document.getElementById('cart-empty');

  if (!items.length) {
    listEl.innerHTML = '';
    summaryEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  summaryEl.style.display = 'block';

  listEl.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="ci-img">
        ${item.image_url ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" onerror="this.style.display='none'">` : '✨'}
      </div>
      <div class="ci-info">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-price">${fmtPrice(item.price)} each</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty('${item.id}',${item.qty-1})">−</button>
        <span class="qty-n">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}',${item.qty+1})">+</button>
      </div>
      <button class="rm-btn" onclick="removeItem('${item.id}')">✕</button>
    </div>
  `).join('');

  const total = cart_total();
  const count = cart_count();
  document.getElementById('cart-count').textContent = `${count} item${count!==1?'s':''}`;
  document.getElementById('cart-subtotal').textContent = fmtPrice(total);
  document.getElementById('cart-total').textContent = fmtPrice(total);
}

function changeQty(id, qty) { cart_updateQty(id, qty); renderCart(); }
function removeItem(id)      { cart_remove(id);          renderCart(); }

document.addEventListener('DOMContentLoaded', initCart);
