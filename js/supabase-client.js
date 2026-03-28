// ═══════════════════════════════════════════════════
//  Supabase Client — with local fallback
//  When no Supabase keys are set, everything uses
//  localStorage so the site works fully offline.
// ═══════════════════════════════════════════════════

const _sb = IS_LOCAL ? null : supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── LOCAL DEMO DATA ───────────────────────────────
const DEMO_PRODUCTS = [
  { id: '1', name: 'Ocean Wave Coaster Set', description: 'Set of 4 resin coasters with ocean wave effect in deep blues and teals. Each one is unique.', price: 24.99, stock: 6, category: 'Coasters', image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: '2', name: 'Wildflower Resin Tray', description: 'Small trinket tray with pressed wildflowers suspended in clear resin. Perfect for jewellery or keys.', price: 18.50, stock: 4, category: 'Trays', image_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: '3', name: 'Galaxy Keyring', description: 'Deep space swirls of purple, navy and gold glitter suspended in domed resin. Comes with silver keyring.', price: 8.99, stock: 12, category: 'Keyrings', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: '4', name: 'Rose Gold Geode Slice', description: 'Large statement wall piece with rose gold leaf and pink crystal geode resin. Approx 30cm wide.', price: 45.00, stock: 2, category: 'Wall Art', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: '5', name: 'Sunset Earrings', description: 'Lightweight teardrop resin earrings with warm amber and coral gradient. Titanium hooks.', price: 12.00, stock: 8, category: 'Jewellery', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
  { id: '6', name: 'Marble Effect Phone Grip', description: 'Swappable phone grip with white and gold marble resin top. Fits most pop socket bases.', price: 9.50, stock: 10, category: 'Accessories', image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
];

// ── LOCAL STORAGE HELPERS ─────────────────────────
const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v)   => { localStorage.setItem(k, JSON.stringify(v)); },
};

function local_getProducts()        { return LS.get('el_products', DEMO_PRODUCTS); }
function local_saveProducts(list)   { LS.set('el_products', list); }
function local_getOrders()          { return LS.get('el_orders', []); }
function local_saveOrders(list)     { LS.set('el_orders', list); }

// ── PRODUCTS ──────────────────────────────────────
async function db_getProducts() {
  if (IS_LOCAL) return local_getProducts();
  const { data, error } = await _sb.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function db_insertProduct(product) {
  if (IS_LOCAL) {
    const list = local_getProducts();
    const newP = { ...product, id: Date.now().toString(), created_at: new Date().toISOString() };
    local_saveProducts([newP, ...list]);
    return newP;
  }
  const { data, error } = await _sb.from('products').insert([product]).select().single();
  if (error) throw error;
  return data;
}

async function db_updateProduct(id, updates) {
  if (IS_LOCAL) {
    const list = local_getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
    local_saveProducts(list);
    return list.find(p => p.id === id);
  }
  const { data, error } = await _sb.from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function db_deleteProduct(id) {
  if (IS_LOCAL) { local_saveProducts(local_getProducts().filter(p => p.id !== id)); return; }
  const { error } = await _sb.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── IMAGES ────────────────────────────────────────
async function db_uploadImage(file) {
  if (IS_LOCAL) {
    // Return a local object URL for preview — won't persist after refresh but fine for testing
    return URL.createObjectURL(file);
  }
  const ext  = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await _sb.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = _sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ── ORDERS ────────────────────────────────────────
async function db_insertOrder(order) {
  if (IS_LOCAL) {
    const orders = local_getOrders();
    const newO = { ...order, status: 'Processing', created_at: new Date().toISOString(), order_items: [] };
    local_saveOrders([newO, ...orders]);
    return newO;
  }
  const { data, error } = await _sb.from('orders').insert([{ ...order, status: 'Processing' }]).select().single();
  if (error) throw error;
  return data;
}

async function db_insertOrderItems(items) {
  if (IS_LOCAL) {
    const orders = local_getOrders();
    const orderId = items[0]?.order_id;
    const updated = orders.map(o => o.id === orderId ? { ...o, order_items: items } : o);
    local_saveOrders(updated);
    return;
  }
  const { error } = await _sb.from('order_items').insert(items);
  if (error) throw error;
}

async function db_getOrderById(id) {
  if (IS_LOCAL) {
    const order = local_getOrders().find(o => o.id === id);
    if (!order) throw new Error('Not found');
    return order;
  }
  const { data, error } = await _sb.from('orders').select('*, order_items(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function db_getAllOrders() {
  if (IS_LOCAL) return local_getOrders();
  const { data, error } = await _sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function db_updateOrderStatus(id, status) {
  if (IS_LOCAL) {
    local_saveOrders(local_getOrders().map(o => o.id === id ? { ...o, status } : o));
    return;
  }
  const { error } = await _sb.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

async function db_decrementStock(productId, qty) {
  if (IS_LOCAL) {
    const list = local_getProducts().map(p =>
      p.id === productId ? { ...p, stock: Math.max(0, p.stock - qty) } : p
    );
    local_saveProducts(list);
    return;
  }
  const { data: p } = await _sb.from('products').select('stock').eq('id', productId).single();
  if (p) await _sb.from('products').update({ stock: Math.max(0, p.stock - qty) }).eq('id', productId);
}

// ── AUTH ──────────────────────────────────────────
const LOCAL_ADMIN = { email: 'admin@egglab.local', password: 'egglab2024' };

async function auth_signIn(email, password) {
  if (IS_LOCAL) {
    if (email === LOCAL_ADMIN.email && password === LOCAL_ADMIN.password) {
      localStorage.setItem('el_admin_session', '1');
      return { user: { email } };
    }
    throw new Error('Invalid credentials');
  }
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function auth_signOut() {
  if (IS_LOCAL) { localStorage.removeItem('el_admin_session'); return; }
  await _sb.auth.signOut();
}

async function auth_getSession() {
  if (IS_LOCAL) return localStorage.getItem('el_admin_session') ? { user: {} } : null;
  const { data: { session } } = await _sb.auth.getSession();
  return session;
}
