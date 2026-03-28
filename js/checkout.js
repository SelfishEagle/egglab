// ═══════════════════════════════════════════════════
//  Checkout Page — PayPal.me payment
// ═══════════════════════════════════════════════════

async function initCheckout() {
  await currency_init();
  renderNav('');
  const items = cart_get();
  if (!items.length) { window.location.href = siteUrl('/cart.html'); return; }
  renderOrderSummary(items);
}

function renderOrderSummary(items) {
  document.getElementById('order-lines').innerHTML = items.map(i => `
    <div class="order-line">
      <span>${esc(i.name)} \u00d7 ${i.qty}</span>
      <span style="color:var(--brown);font-weight:600">${fmtPrice(i.price * i.qty)}</span>
    </div>
  `).join('');
  document.getElementById('order-total').textContent = fmtPrice(cart_total());
  document.getElementById('pay-btn').textContent = `Pay ${fmtPrice(cart_total())} via PayPal`;
}

async function submitCheckout() {
  const name  = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const addr  = document.getElementById('f-addr').value.trim();
  const city  = document.getElementById('f-city').value.trim();
  const post  = document.getElementById('f-post').value.trim();

  clearErrors();
  let valid = true;
  if (!name)                         { showFieldErr('f-name',  'Required');             valid = false; }
  if (!email || !email.includes('@')) { showFieldErr('f-email', 'Valid email required'); valid = false; }
  if (!addr)                         { showFieldErr('f-addr',  'Required');             valid = false; }
  if (!city)                         { showFieldErr('f-city',  'Required');             valid = false; }
  if (!post)                         { showFieldErr('f-post',  'Required');             valid = false; }
  if (!valid) return;

  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.textContent = 'Saving order\u2026';

  const orderId = genOrderId();
  const total   = cart_total();
  const items   = cart_get();

  // Save order to Supabase
  try {
    await db_insertOrder({
      id: orderId,
      customer_name: name,
      customer_email: email,
      customer_address: `${addr}, ${city}, ${post}`,
      total: total,
      stripe_payment_intent: null,
    });
    await db_insertOrderItems(items.map(i => ({
      order_id: orderId,
      product_id: i.id,
      product_name: i.name,
      price: i.price,
      qty: i.qty,
    })));
    // Decrement stock
    for (const i of items) {
      await db_decrementStock(i.id, i.qty).catch(() => {});
    }
  } catch (e) {
    console.warn('Order save failed (check Supabase config):', e.message);
  }

  // Store for confirmed.html
  sessionStorage.setItem('egglab_last_order', JSON.stringify({
    id: orderId, customer_name: name, customer_email: email, total, items,
  }));

  cart_clear();

  // Go to confirmed page — it will show order ID and a button to open PayPal
  window.location.href = siteUrl('/confirmed.html') + `?order=${encodeURIComponent(orderId)}&amount=${total.toFixed(2)}`;
}

function showFieldErr(id, msg) {
  const el = document.getElementById(id);
  el.classList.add('fi-err');
  const next = el.nextElementSibling;
  if (next?.classList.contains('err-msg')) next.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.fi').forEach(e => e.classList.remove('fi-err'));
  document.querySelectorAll('.err-msg').forEach(e => e.textContent = '');
}

document.addEventListener('DOMContentLoaded', initCheckout);
