// ═══════════════════════════════════════════════════
//  Currency Converter
//  Fetches live rates from open.er-api.com (free, no key)
//  Falls back to hardcoded approximate rates if offline
// ═══════════════════════════════════════════════════

const SUPPORTED_CURRENCIES = [
  { code: 'AUD', symbol: 'A$',  flag: '🇦🇺' },
  { code: 'USD', symbol: '$',   flag: '🇺🇸' },
  { code: 'GBP', symbol: '£',   flag: '🇬🇧' },
  { code: 'EUR', symbol: '€',   flag: '🇪🇺' },
  { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'CAD', symbol: 'CA$', flag: '🇨🇦' },
];

// Fallback rates relative to AUD (updated occasionally)
const FALLBACK_RATES = {
  AUD: 1, USD: 0.64, GBP: 0.51, EUR: 0.60, NZD: 1.08, CAD: 0.88,
};

let _rates    = { ...FALLBACK_RATES };
let _activeCurrency = localStorage.getItem('el_currency') || 'AUD';
let _ratesLoaded = false;

async function currency_init() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AUD');
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        _rates = { AUD: 1 };
        SUPPORTED_CURRENCIES.forEach(c => {
          if (data.rates[c.code]) _rates[c.code] = data.rates[c.code];
        });
        _ratesLoaded = true;
      }
    }
  } catch {
    // Use fallback rates silently
  }
}

function currency_convert(audAmount) {
  const rate = _rates[_activeCurrency] || 1;
  return audAmount * rate;
}

function currency_getSymbol(code) {
  return SUPPORTED_CURRENCIES.find(c => c.code === (code || _activeCurrency))?.symbol || 'A$';
}

function currency_format(audAmount) {
  const converted = currency_convert(audAmount);
  const symbol = currency_getSymbol();
  return `${symbol}${converted.toFixed(2)}`;
}

function currency_setActive(code) {
  _activeCurrency = code;
  localStorage.setItem('el_currency', code);
  // Re-render all price elements on the page
  document.querySelectorAll('[data-aud-price]').forEach(el => {
    el.textContent = currency_format(parseFloat(el.dataset.audPrice));
  });
  // Update the picker label
  const picker = document.getElementById('currency-picker');
  if (picker) {
    const cur = SUPPORTED_CURRENCIES.find(c => c.code === code);
    document.getElementById('currency-label').textContent = `${cur.flag} ${cur.code}`;
    picker.querySelectorAll('.cc-opt').forEach(o => {
      o.classList.toggle('active', o.dataset.code === code);
    });
  }
}

function currency_renderPicker() {
  const cur = SUPPORTED_CURRENCIES.find(c => c.code === _activeCurrency) || SUPPORTED_CURRENCIES[0];
  return `
    <div id="currency-picker" style="position:relative;display:inline-block">
      <button id="currency-toggle" onclick="toggleCurrencyMenu()" style="
        background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
        color:var(--cream);padding:.3rem .7rem;border-radius:20px;font-size:.78rem;
        font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.35rem;
        font-family:'Nunito',sans-serif;transition:background .2s;">
        <span id="currency-label">${cur.flag} ${cur.code}</span>
        <span style="font-size:.6rem;opacity:.7">▼</span>
      </button>
      <div id="currency-menu" style="
        display:none;position:absolute;top:calc(100% + .4rem);right:0;
        background:var(--white);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.2);
        overflow:hidden;min-width:130px;z-index:999;">
        ${SUPPORTED_CURRENCIES.map(c => `
          <button class="cc-opt${c.code === _activeCurrency ? ' active' : ''}"
            data-code="${c.code}"
            onclick="currency_setActive('${c.code}');toggleCurrencyMenu()"
            style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem .85rem;
              border:none;background:none;cursor:pointer;font-size:.83rem;font-weight:600;
              color:var(--dark);font-family:'Nunito',sans-serif;transition:background .15s;
              ${c.code === _activeCurrency ? 'background:var(--cream);color:var(--brown);' : ''}">
            <span>${c.flag}</span>
            <span>${c.code}</span>
            <span style="opacity:.5;font-weight:400;font-size:.75rem">${c.symbol}</span>
          </button>
        `).join('')}
        ${!_ratesLoaded ? '<div style="font-size:.68rem;color:#9a7050;padding:.3rem .85rem .55rem;border-top:1px solid var(--border)">Using approximate rates</div>' : '<div style="font-size:.68rem;color:#9a7050;padding:.3rem .85rem .55rem;border-top:1px solid var(--border)">Live exchange rates</div>'}
      </div>
    </div>
  `;
}

function toggleCurrencyMenu() {
  const menu = document.getElementById('currency-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close menu when clicking outside
document.addEventListener('click', e => {
  const picker = document.getElementById('currency-picker');
  if (picker && !picker.contains(e.target)) {
    const menu = document.getElementById('currency-menu');
    if (menu) menu.style.display = 'none';
  }
});
