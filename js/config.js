// ═══════════════════════════════════════════════════
//  EggLab Creations — Configuration
// ═══════════════════════════════════════════════════

const CONFIG = {
  // ── Supabase ────────────────────────────────────
  SUPABASE_URL:      'https://jelaufecfkwsniolzkvl.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_GPoyUagRbKlRRA0Me9Cj_Q_onyp6MVo',

  // ── PayPal.me ───────────────────────────────────
  PAYPAL_ME_USERNAME: 'paypal.me/egglabcreationsau',

  // ── Base currency (what prices are stored in) ───
  CURRENCY:        'aud',
  CURRENCY_SYMBOL: 'A$',
  CURRENCY_CODE:   'AUD',

  // ── Business ────────────────────────────────────
  BUSINESS_NAME:  'EggLab Creations',
  BUSINESS_EMAIL: 'eggloocraftstudio@gmail.com',
};

const IS_LOCAL = !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === '';
