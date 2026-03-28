// ═══════════════════════════════════════════════════
//  Track Order Page
// ═══════════════════════════════════════════════════

async function initTrack() {
  await currency_init();
  renderNav('track');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    document.getElementById('track-input').value = id;
    searchOrder();
  }
  document.getElementById('track-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchOrder();
  });
}

async function searchOrder() {
  const input = document.getElementById('track-input').value.trim().toUpperCase();
  if (!input) return;
  const resultEl = document.getElementById('track-result');
  resultEl.innerHTML = '<div class="loading"><span class="spinner"></span>Looking up your order…</div>';
  try {
    const order = await db_getOrderById(input);
    renderOrderResult(order, resultEl);
  } catch {
    resultEl.innerHTML = `
      <div style="background:#fee;border:1.5px solid #faa;border-radius:8px;padding:1rem;font-size:.85rem;color:#c55">
        No order found with ID <strong>${esc(input)}</strong>. Please double-check and try again.
      </div>`;
  }
}

function renderOrderResult(order, el) {
  const items = order.order_items || [];
  const history = buildHistory(order);
  el.innerHTML = `
    <div class="track-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--brown)">${esc(order.id)}</div>
          <div style="font-size:.78rem;color:#9a7050">Placed ${fmtDate(order.created_at)} · ${esc(order.customer_name)}</div>
        </div>
        ${statusPill(order.status)}
      </div>
      <hr class="divider">
      ${items.map(i => `
        <div class="order-line">
          <span>${esc(i.product_name)} × ${i.qty}</span>
          <span style="color:var(--brown)">${fmtPrice(i.price * i.qty)}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;font-weight:700;padding-top:.5rem;border-top:1px solid var(--border);margin-top:.4rem;font-family:'Playfair Display',serif">
        <span>Total</span><span style="color:var(--brown)">${fmtPrice(order.total)}</span>
      </div>
      <hr class="divider">
      <div style="font-size:.73rem;font-weight:700;color:var(--amber);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.5rem">Status Timeline</div>
      <div class="timeline">
        ${history.map(s => `
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div><div class="tl-label">${esc(s.label)}</div><div class="tl-time">${esc(s.time)}</div></div>
          </div>
        `).join('')}
      </div>
      ${order.customer_address ? `<div style="margin-top:1rem;font-size:.8rem;color:#9a7050">Shipping to: ${esc(order.customer_address)}</div>` : ''}
    </div>
  `;
}

function buildHistory(order) {
  const placed = fmtDate(order.created_at);
  const h = [{ label: 'Order Placed', time: placed }];
  if (['Shipped','Delivered','Cancelled'].includes(order.status)) {
    h.push({ label: order.status === 'Cancelled' ? 'Order Cancelled' : 'Order Shipped', time: '—' });
  }
  if (order.status === 'Delivered') {
    h.push({ label: 'Delivered', time: '—' });
  }
  return h;
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

document.addEventListener('DOMContentLoaded', initTrack);
