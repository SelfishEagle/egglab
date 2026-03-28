// ═══════════════════════════════════════════════════
//  Confirmed Page — shown after checkout
//  Customer then clicks through to PayPal to pay
// ═══════════════════════════════════════════════════

async function initConfirmed() {
  await currency_init();
  renderNav('');

  const params  = new URLSearchParams(window.location.search);
  const orderId = params.get('order');
  const amount  = params.get('amount');

  const raw = sessionStorage.getItem('egglab_last_order');
  const order = raw ? JSON.parse(raw) : null;

  if (!orderId && !order) {
    window.location.href = siteUrl('/');
    return;
  }

  const id           = orderId || order?.id;
  const customerName = order?.customer_name || '';
  const email        = order?.customer_email || '';
  const total        = amount || order?.total || '0.00';
  const items        = order?.items || [];

  // Build PayPal.me URL
  const paypalUrl = `https://paypal.me/${CONFIG.PAYPAL_ME_USERNAME}/${parseFloat(total).toFixed(2)}`;

  // Populate the page
  document.getElementById('confirm-customer').textContent = customerName;
  document.getElementById('confirm-email').textContent    = email;
  document.getElementById('confirm-total').textContent    = fmtPrice(parseFloat(total));
  document.getElementById('order-id-display').textContent = id;
  document.getElementById('track-link').href = `/track.html?id=${encodeURIComponent(id)}`;

  document.getElementById('confirm-items').innerHTML = items.map(i => `
    <div class="order-line">
      <span>${esc(i.name)} \u00d7 ${i.qty}</span>
      <span>${fmtPrice(i.price * i.qty)}</span>
    </div>
  `).join('') || '<div style="font-size:.85rem;color:#9a7050">See your order ID above.</div>';

  // Wire up the PayPal button
  const ppBtn = document.getElementById('paypal-btn');
  ppBtn.href = paypalUrl;
  ppBtn.textContent = `Pay ${fmtPrice(parseFloat(total))} via PayPal`;

  document.getElementById('confirmed-loading').style.display = 'none';
  document.getElementById('confirmed-success').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initConfirmed);
