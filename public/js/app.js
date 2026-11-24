const API = 'http://localhost:3000/api';
let currentUser = null;
let state = {
  cart: [],
  products: [],
  categories: [],
  suppliers: [],
  charts: {}
};

// ==================== INIT ====================
async function init() {
  await loadCategories();
  await loadSuppliers();
  renderNav();
  renderSidebar();
}
init();

// ==================== NAV & AUTH ====================
async function renderNav() {
  const links = document.getElementById('navLinks');
  const chip = document.getElementById('userChip');
  const appView = document.getElementById('view-app');
  const loginView = document.getElementById('view-login');

  if (!currentUser) {
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    links.innerHTML = '';
    chip.innerHTML = '';
    return;
  }
  appView.classList.remove('hidden');
  loginView.classList.add('hidden');

  const isOwner = currentUser.role === 'Owner';
  const isStaf = currentUser.role === 'Staf';
  const isCust = currentUser.role === 'Konsumen';

  chip.innerHTML = `<span>${currentUser.name}</span><span style="font-size:11px;font-weight:400;opacity:.8">${currentUser.role}</span>`;

  links.innerHTML = `
    <a href="#/" onclick="switchView('dashboard')" class="${state.view==='dashboard'?'active':''}">Beranda${isOwner?' <span style="font-size:10px">Owner</span>' : isStaf?' <span style="font-size:10px">Kasir</span>':''}</a>
    ${isOwner?`<a href="#/inventory" onclick="switchView('inventory')" class="${state.view==='inventory'?'active':''}">Stok</a>
    <a href="#/procurement" onclick="switchView('procurement')" class="${state.view==='procurement'?'active':''}">Pembelian</a>
    <a href="#/suppliers" onclick="switchView('suppliers')" class="${state.view==='suppliers'?'active':''}">Pemasok</a>
    <a href="#/customers" onclick="switchView('customers')" class="${state.view==='customers'?'active':''}">Pelanggan</a>
    <a href="#/complaints" onclick="switchView('complaints')" class="${state.view==='complaints'?'active':''}">Keluhan</a>`:''}
    ${isStaf?`<a href="#/pos" onclick="switchView('pos')" class="${state.view==='pos'?'active':''}">Kasir POS</a>`:''}
    ${isCust?`<a href="#/catalog" onclick="switchView('catalog')" class="${state.view==='catalog'?'active':''}">Belanja</a>`:''}
    <a href="#" onclick="app.logout()" style="color:var(--danger);">Keluar</a>`;
}

function switchView(v) {
  state.view = v;
  renderNav();
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  document.getElementById('view-' + v).classList.remove('hidden');
  if (v === 'dashboard') loadDashboard();
  if (v === 'inventory') loadInventory();
  if (v === 'pos') loadPOS();
  if (v === 'catalog') loadCatalog();
  if (v === 'procurement') loadProcurement();
  if (v === 'suppliers') loadSuppliersUI();
  if (v === 'customers') loadCustomers();
  if (v === 'complaints') loadComplaints();
}

async function renderSidebar() {
  const sb = document.getElementById('sidebar');
  if (!currentUser) { sb.innerHTML = ''; return; }
  const isOwner = currentUser.role === 'Owner';
  const isStaf = currentUser.role === 'Staf';
  const isCust = currentUser.role === 'Konsumen';
  sb.innerHTML = `
    <div style="padding:0 0 16px 0; font-weight:800; color:var(--green-dark); font-size:16px; display:flex; align-items:center; gap:8px;"><div style="width:10px;height:10px;background:var(--green);border-radius:50%;"></div>Menu</div>
    <ul>
      <li><a href="#/" onclick="switchView('dashboard')" class="${state.view==='dashboard'?'active':''}">📊 Beranda</a></li>
      ${isOwner?`<li><a href="#/inventory" onclick="switchView('inventory')" class="${state.view==='inventory'?'active':''}">📦 Stok Barang</a></li>
      <li><a href="#/procurement" onclick="switchView('procurement')" class="${state.view==='procurement'?'active':''}">🛒 Pembelian</a></li>
      <li><a href="#/suppliers" onclick="switchView('suppliers')" class="${state.view==='suppliers'?'active':''}">🚚 Pemasok</a></li>
      <li><a href="#/customers" onclick="switchView('customers')" class="${state.view==='customers'?'active':''}">👥 Pelanggan</a></li>
      <li><a href="#/complaints" onclick="switchView('complaints')" class="${state.view==='complaints'?'active':''}">💬 Keluhan</a></li>`:''}
      ${isStaf?`<li><a href="#/pos" onclick="switchView('pos')" class="${state.view==='pos'?'active':''}">🧾 Kasir POS</a></li>`:''}
      ${isCust?`<li><a href="#/catalog" onclick="switchView('catalog')" class="${state.view==='catalog'?'active':''}">🛒 Belanja</a></li>`:'`}
    </ul>
    <div style="margin-top:24px;"><button class="btn btn-ghost" style="width:100%" onclick="app.logout()">Keluar</button></div>`;
}

// ==================== API WRAPPER ====================
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: {} };
  if (body) opts.headers['Content-Type'] = 'application/json';
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  return res.json();
}

// ==================== LOGIN ====================
const app = {
  login: async function() {
    const email = document.getElementById('lgEmail').value;
    const pass = document.getElementById('lgPass').value;
    const role = document.getElementById('lgRole').value;
    const r = await api('/auth/login', 'POST', { email, password: pass, role });
    if (r.success) {
      currentUser = r.user;
      switchView('dashboard');
    } else {
      alert(r.error || 'Login gagal');
    }
  },
  logout: function() {
    currentUser = null;
    state.cart = [];
    switchView('login');
  }
};

// ==================== LOADERS ====================
async function loadCategories() {
  const r = await api('/data/categories');
  state.categories = r.data || [];
}
async function loadSuppliers() {
  const r = await api('/data/suppliers');
  state.suppliers = r.data || [];
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  const r = await api('/analytics');
  const a = r.success ? r : { revenue_7d:0, total_orders:0, best_cashier:'-', best_products:[] };
  document.getElementById('statRevenue').innerText = 'Rp' + (a.revenue_7d||0).toLocaleString('id-ID');
  document.getElementById('statOrders').innerText = a.total_orders || 0;
  document.getElementById('statCashier').innerText = a.best_cashier || '-';
  document.getElementById('statProduct').innerText = (a.best_products&&a.best_products[0])?a.best_products[0].name:'-';
  renderCharts(a);
  fetchWeather();
}
async function fetchWeather() {
  const r = await api('/weather');
  const el = document.getElementById('diagText');
  if (r.error) { el.innerHTML = '<span style="color:var(--danger)">Gagal ambil cuaca</span>'; return; }
  const w = r.weather || {};
  const temp = w.current_weather?.temperature ?? '-';
  const ws = w.current_weather?.windspeed ?? '-';
  el.innerHTML = `Suhu: <strong>${temp}°C</strong>, Angin: <strong>${ws}</strong>. Cuaca cerah cenderung naikkan kunjungan langsung; hujan meningkatkan pengiriman GoSend/GrabMart.`;
}
function renderCharts(a) {
  const ctxS = document.getElementById('chSales').getContext('2d');
  if (state.charts.sales) state.charts.sales.destroy();
  state.charts.sales = new Chart(ctxS, {
    type: 'line',
    data: {
      labels: ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],
      datasets: [{ label: 'Pendapatan (Rp)', data: [1200000,1500000,1100000,1800000,1600000,2100000,1900000], borderColor: '#15803d', backgroundColor: 'rgba(21,128,61,0.1)', tension: 0.3, fill: true }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
  const ctxP = document.getElementById('chProd').getContext('2d');
  if (state.charts.prod) state.charts.prod.destroy();
  state.charts.prod = new Chart(ctxP, {
    type: 'bar',
    data: {
      labels: (a.best_products||[]).map(x=>x.name).length ? a.best_products.map(x=>x.name) : ['-'],
      datasets: [{ label: 'Terjual', data: (a.best_products||[]).map(x=>x.qty).length ? a.best_products.map(x=>x.qty) : [0], backgroundColor: '#22c55e' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}
app.runWilting = async function() {
  const r = await api('/wilting-check', 'POST');
  alert(r.success ? r.message || 'Selesai' : r.error);
  loadInventory();
};

// ==================== INVENTORY ====================
async function loadInventory() {
  const r = await api('/data/products');
  state.products = r.data || [];
  renderInventory();
}
function renderInventory() {
  const q = document.getElementById('invSearch').value.toLowerCase();
  const tbody = document.querySelector('#invTable tbody');
  const filtered = state.products.filter(p => (p.name||'').toLowerCase().includes(q) || (p.barcode||'').toLowerCase().includes(q));
  tbody.innerHTML = filtered.map(p => {
    const cat = state.categories.find(c => c.id === p.category_id);
    const badge = p.status === 'on_sale' ? 'badge-warn' : (parseFloat(p.stock_qty||0) < parseFloat(p.min_stock||0) ? 'badge-danger' : 'badge-success');
    return `<tr>
      <td>${p.barcode}</td><td>${p.name}</td><td>${cat?cat.name:'-'}</td>
      <td>Rp${parseFloat(p.purchase_price||0).toLocaleString('id-ID')}</td>
      <td>Rp${parseFloat(p.selling_price||0).toLocaleString('id-ID')}</td>
      <td>${p.stock_qty} ${p.unit}</td><td>${p.min_stock}</td>
      <td><span class="badge ${badge}">${p.status}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="app.openProductModal('${p.id}')">Ubah</button></td>
    </tr>`;
  }).join('');
}
app.openProductModal = function(p = {}) {
  const html = `
  <div class="modal-backdrop" id="prodModal">
    <div class="modal-panel">
      <h3>${p.id ? 'Edit' : 'Tambah'} Produk</h3>
      <div class="input-group"><label>Barcode</label><input id="mBarcode" value="${p.barcode||''}"></div>
      <div class="input-group"><label>Nama Produk</label><input id="mName" value="${p.name||''}"></div>
      <div class="input-group"><label>Kategori</label><select id="mCat">${state.categories.map(c=>`<option value="${c.id}" ${p.category_id===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
      <div class="input-group"><label>Harga Modal</label><input type="number" id="mPurchase" value="${p.purchase_price||''}"></div>
      <div class="input-group"><label>Margin (%)</label><input type="number" id="mMargin" value="${p.margin_percent||30}"></div>
      <div class="input-group"><label>Unit</label><select id="mUnit"><option value="kg" ${p.unit==='kg'?'selected':''}>kg</option><option value="gram" ${p.unit==='gram'?'selected':''}>gram</option><option value="pcs" ${p.unit==='pcs'?'selected':''}>pcs</option><option value="dus" ${p.unit==='dus'?'selected':''}>dus</option></select></div>
      <div class="input-group"><label>Stok Minimum</label><input type="number" id="mMin" value="${p.min_stock||''}"></div>
      <div class="input-group"><label>Tanggal Masuk</label><input type="date" id="mDate" value="${p.date_received||''}"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="document.getElementById('prodModal').remove()">Batal</button>
        <button class="btn btn-primary" onclick="app.saveProduct('${p.id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
};
app.saveProduct = async function(id) {
  const obj = {
    table: 'products', id: id || Date.now().toString(36),
    barcode: document.getElementById('mBarcode').value,
    name: document.getElementById('mName').value,
    category_id: document.getElementById('mCat').value,
    purchase_price: document.getElementById('mPurchase').value,
    margin_percent: document.getElementById('mMargin').value,
    unit: document.getElementById('mUnit').value,
    min_stock: document.getElementById('mMin').value,
    date_received: document.getElementById('mDate').value,
    condition: 'normal', status: 'active', updated_at: new Date().toISOString()
  };
  const pp = parseFloat(obj.purchase_price||0); const mg = parseFloat(obj.margin_percent||30);
  obj.selling_price = pp * (1 + mg/100);
  const r = await api('/save', 'POST', obj);
  if (r.success) {
    document.getElementById('prodModal').remove();
    loadInventory();
    alert('Produk disimpan. Harga jual dihitung otomatis dari margin.');
  } else alert(r.error || 'Gagal');
};

// ==================== POS ====================
let posCart = [];
async function loadPOS() {
  const r = await api('/data/products');
  state.products = r.data || [];
  const list = state.products.map(p => `<div class="row-cart"><div style="flex:1"><div style="font-weight:700">${p.name}</div><div style="font-size:12px;color:var(--muted)">${p.barcode} • ${p.unit}</div></div><div>Rp${parseFloat(p.selling_price||0).toLocaleString('id-ID')}</div><button class="btn btn-success btn-sm" onclick="app.addPosItem('${p.id}','${p.name}',${p.selling_price},'${p.unit}')">+</button></div>`).join('');
  document.getElementById('posProductList').innerHTML = list || '<div class="empty">Produk kosong</div>';
  renderPosCart();
  document.getElementById('posMethod').onchange = e => {
    document.getElementById('pickupBox').style.display = e.target.value === 'pickup' ? 'block' : 'none';
    document.getElementById('custBox').style.display = e.target.value === 'qris' ? 'block' : 'none';
  };
}
app.addPosItem = function(id, name, price, unit) {
  const e = posCart.find(x => x.id === id);
  if (e) e.qty++; else posCart.push({ id, name, price, unit, qty: 1 });
  renderPosCart();
};
function renderPosCart() {
  const el = document.getElementById('posCart');
  const tot = posCart.reduce((s, x) => s + x.price * x.qty, 0);
  el.innerHTML = posCart.map((x, i) => `<div class="row-cart"><div style="flex:1"><div style="font-weight:700">${x.name}</div><div style="font-size:12px;color:var(--muted)">${x.unit}</div></div><div>Rp${(x.price*x.qty).toLocaleString('id-ID')}</div><button class="btn btn-ghost btn-sm" onclick="posCart.splice(${i},1);renderPosCart()">×</button></div>`).join('');
  document.getElementById('posTotal').innerText = 'Rp' + tot.toLocaleString('id-ID');
}
app.finalizePos = async function() {
  const method = document.getElementById('posMethod').value;
  const total = posCart.reduce((s, x) => s + x.price * x.qty, 0);
  const r = await api('/checkout', 'POST', {
    items: JSON.stringify(posCart), total, paymentMethod: method,
    userId: currentUser.id, customerId: 'walkin',
    shippingProvider: method === 'gosend' ? 'GoSend' : method === 'grab' ? 'GrabMart' : '-',
    pickupTime: document.getElementById('posPickup') ? document.getElementById('posPickup').value : '-'
  });
  if (r.success) { alert('Faktur ' + r.invoiceNumber + ' dibuat.'); posCart = []; renderPosCart(); loadInventory(); }
  else alert(r.error || 'Gagal');
};

// ==================== CATALOG (KONSUMEN) ====================
async function loadCatalog() {
  await loadCategories();
  const r = await api('/data/products');
  state.products = r.data || [];
  renderCatalog();
}
function renderCatalog() {
  const q = document.getElementById('catSearch').value.toLowerCase();
  const list = document.getElementById('catProductList');
  const filtered = state.products.filter(p => (p.name||'').toLowerCase().includes(q));
  list.innerHTML = filtered.map(p => {
    const onSale = p.status === 'on_sale';
    return `<div class="card" style="padding:14px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">${state.categories.find(c=>c.id===p.category_id)?.name||''}</div>
      <div style="font-weight:800;font-size:16px;margin-bottom:4px">${p.name}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Stok: ${p.stock_qty} ${p.unit}</div>
      ${onSale?`<span class="badge badge-warn" style="margin-bottom:8px">🔥 On Sale / Underprice</span>`:''}
      <div style="font-size:18px;font-weight:800;color:var(--green-dark)">Rp${parseFloat(p.selling_price||0).toLocaleString('id-ID')} / ${p.unit}</div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" onclick="app.addToCart('${p.id}','${p.name}',${p.selling_price},'${p.unit}')">Masukkan Keranjang</button>
    </div>`;
  }).join('');
}
app.filterCat = function(id) {
  const filtered = id === 'all' ? state.products : state.products.filter(p => p.category_id === id);
  const list = document.getElementById('catProductList');
  list.innerHTML = filtered.map(p => renderCatalogCard(p)).join('');
};
app.filterSale = function() {
  const filtered = state.products.filter(p => p.status === 'on_sale');
  const list = document.getElementById('catProductList');
  list.innerHTML = filtered.length ? filtered.map(renderCatalogCard).join('') : '<div class="empty">Tidak ada produk diskon</div>';
};
function renderCatalogCard(p) {
  const onSale = p.status === 'on_sale';
  return `<div class="card" style="padding:14px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">${state.categories.find(c=>c.id===p.category_id)?.name||''}</div>
    <div style="font-weight:800;font-size:16px;margin-bottom:4px">${p.name}</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Stok: ${p.stock_qty} ${p.unit}</div>
    ${onSale?`<span class="badge badge-warn" style="margin-bottom:8px">🔥 On Sale / Underprice</span>`:''}
    <div style="font-size:18px;font-weight:800;color:var(--green-dark)">Rp${parseFloat(p.selling_price||0).toLocaleString('id-ID')} / ${p.unit}</div>
    <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" onclick="app.addToCart('${p.id}','${p.name}',${p.selling_price},'${p.unit}')">Masukkan Keranjang</button>
  </div>`;
}
app.addToCart = function(id, name, price, unit) {
  const exist = state.cart.find(x => x.id === id);
  if (exist) exist.qty++; else state.cart.push({ id, name, price, unit, qty: 1 });
  updateCartUI();
  alert(`${name} ditambahkan ke keranjang`);
};
function updateCartUI() {
  const badge = document.getElementById('cartBadge'); if (badge) { const tq = state.cart.reduce((s,x)=>s+x.qty,0); badge.innerText = tq; badge.style.display = tq ? 'inline-flex' : 'none'; }
  const count = document.getElementById('cartCount'); if (count) count.innerText = state.cart.length;
  const total = document.getElementById('cartTotal'); if (total) total.innerText = 'Rp' + state.cart.reduce((s,x)=>s+x.price*x.qty,0).toLocaleString('id-ID');
  const items = document.getElementById('cartItems'); if (items) items.innerHTML = state.cart.map((x,i)=>`<div class="row-cart"><div style="flex:1"><div style="font-weight:700">${x.name}</div><div style="font-size:12px;color:var(--muted)">${x.unit}</div></div><div>Rp${(x.price*x.qty).toLocaleString('id-ID')}</div><button class="btn btn-ghost btn-sm" onclick="app.removeCart(${i})">×</button></div>`).join('');
}
app.toggleCart = function() {
  const slide = document.getElementById('cartSlide');
  slide.classList.toggle('open');
};
app.removeCart = function(i) {
  state.cart.splice(i, 1); updateCartUI();
};
app.doCheckout = async function() {
  const file = document.getElementById('proofFile').files[0];
  if (!file) { alert('Silakan unggah bukti pembayaran QRIS'); return; }
  const form = new FormData();
  form.append('payment_proof', file);
  form.append('items', JSON.stringify(state.cart));
  form.append('total', state.cart.reduce((s,x)=>s+x.price*x.qty,0));
  form.append('paymentMethod', 'qris');
  form.append('userId', currentUser.id);
  form.append('customerId', currentUser.id);
  const res = await fetch(API + '/checkout', { method: 'POST', body: form });
  const r = await res.json();
  if (r.success) { alert('Pesanan '+r.invoiceNumber+' diterima. Tunggu konfirmasi admin.'); state.cart = []; updateCartUI(); document.getElementById('cartSlide').classList.remove('open'); }
  else alert(r.error || 'Gagal checkout');
};

// ==================== PROCUREMENT ====================
async function loadProcurement() {
  const pos = await api('/data/purchase_orders');
  const supp = await api('/data/suppliers');
  const rows = (pos.data || []).map(o => {
    const s = (supp.data || []).find(x => x.id === o.supplier_id);
    return `<tr><td>${o.po_number}</td><td>${s?s.name:'-'}</td><td>${o.order_date}</td><td><span class="badge ${o.status==='received'?'badge-success':o.status==='shipped'?'badge-warn':'badge-normal'}">${o.status}</span></td><td>Rp${parseFloat(o.total_amount||0).toLocaleString('id-ID')}</td><td><button class="btn btn-ghost btn-sm" onclick="app.receivePo('${o.id}')">Terima Barang</button></td></tr>`;
  }).join('');
  document.getElementById('poTable').querySelector('tbody').innerHTML = rows || '<tr><td colspan="6" class="empty">Belum ada PO</td></tr>';
}
app.openPoModal = function() {
  const html = `
  <div class="modal-backdrop" id="poModal">
    <div class="modal-panel">
      <h3>Buat Pesanan Pemasok</h3>
      <div class="input-group"><label>Pemasok</label><select id="poSupp">${state.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div class="input-group"><label>Tanggal Kirim Estimasi</label><input type="date" id="poDate"></div>
      <div class="input-group"><label>Catatan</label><input id="poNotes"></div>
      <div class="modal-actions"><button class="btn btn-ghost" onclick="document.getElementById('poModal').remove()">Batal</button><button class="btn btn-primary" onclick="app.createPo()">Buat PO</button></div>
    </div>
  </div>`;
  const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
};
app.createPo = async function() {
  const id = Date.now().toString(36);
  const r = await api('/save', 'POST', {
    table: 'purchase_orders', id, po_number: 'PO-' + id,
    supplier_id: document.getElementById('poSupp').value,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: document.getElementById('poDate').value,
    status: 'pending', total_amount: 0, notes: document.getElementById('poNotes').value, created_by: currentUser.id
  });
  if (r.success) { document.getElementById('poModal').remove(); loadProcurement(); }
  else alert(r.error || 'Gagal');
};
app.receivePo = async function(poId) {
  const r = await api('/receive', 'POST', { poId, receivedBy: currentUser.id, notes: 'Terima barang', totalQty: 0 });
  if (r.success) { alert('Barang diterima. Stok bertambah (FIFO).'); loadProcurement(); loadInventory(); }
  else alert(r.error || 'Gagal');
};

// ==================== SUPPLIERS ====================
async function loadSuppliersUI() {
  const r = await api('/data/suppliers');
  state.suppliers = r.data || [];
  const rows = state.suppliers.map(s => `<tr><td>${s.name}</td><td>${s.contact_person}</td><td>${s.phone}</td><td>${s.items_supplied}</td><td>${s.lead_time_days} hari</td><td><button class="btn btn-ghost btn-sm" onclick="app.editSupplier('${s.id}')">Ubah</button></td></tr>`).join('');
  document.getElementById('suppTable').querySelector('tbody').innerHTML = rows || '<tr><td colspan="6" class="empty">Kosong</td></tr>';
}
app.openSupplierModal = function() {
  const html = `
  <div class="modal-backdrop" id="suppModal">
    <div class="modal-panel">
      <h3>Pemasok</h3>
      <div class="input-group"><label>Nama</label><input id="sName"></div>
      <div class="input-group"><label>Kontak Person</label><input id="sContact"></div>
      <div class="input-group"><label>Telepon</label><input id="sPhone"></div>
      <div class="input-group"><label>Barang</label><input id="sItems"></div>
      <div class="input-group"><label>Lead Time (hari)</label><input type="number" id="sLead"></div>
      <div class="modal-actions"><button class="btn btn-ghost" onclick="document.getElementById('suppModal').remove()">Batal</button><button class="btn btn-primary" onclick="app.saveSupplier()">Simpan</button></div>
    </div>
  </div>`;
  const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
};
app.saveSupplier = async function() {
  const r = await api('/save', 'POST', {
    table: 'suppliers', id: Date.now().toString(36),
    name: document.getElementById('sName').value, contact_person: document.getElementById('sContact').value,
    phone: document.getElementById('sPhone').value, email: '', address: '', items_supplied: document.getElementById('sItems').value,
    lead_time_days: document.getElementById('sLead').value, created_at: new Date().toISOString()
  });
  if (r.success) { document.getElementById('suppModal').remove(); loadSuppliersUI(); }
  else alert(r.error || 'Gagal');
};
app.editSupplier = function(id) { alert('Edit pemasok: ' + id); };

// ==================== CUSTOMERS ====================
async function loadCustomers() {
  const r = await api('/data/customers');
  const rows = (r.data || []).map(c => `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.category}</td><td>${c.segment}</td><td>Rp${parseFloat(c.total_spend||0).toLocaleString('id-ID')}</td><td>${c.points}</td></tr>`).join('');
  document.getElementById('custTable').querySelector('tbody').innerHTML = rows || '<tr><td colspan="6" class="empty">Kosong</td></tr>';
}

// ==================== COMPLAINTS ====================
async function loadComplaints() {
  const r = await api('/data/complaints');
  const rows = (r.data || []).map(c => `<tr><td>${c.customer_id}</td><td>${c.complaint_type}</td><td>${c.description}</td><td><span class="badge ${c.status==='resolved'?'badge-success':'badge-warn'}">${c.status}</span></td><td><button class="btn btn-ghost btn-sm" onclick="app.resolveComplaint('${c.id}')">Selesai</button></td></tr>`).join('');
  document.getElementById('compTable').querySelector('tbody').innerHTML = rows || '<tr><td colspan="5" class="empty">Kosong</td></tr>';
}
app.resolveComplaint = async function(id) {
  if (!confirm('Tandai selesai?')) return;
  await api('/save', 'POST', { table: 'complaints', id, status: 'resolved', stock_adjusted: 1, resolved_at: new Date().toISOString() });
  loadComplaints();
};

// ==================== GLOBAL EXPOSE ====================
window.app = app;
window.switchView = switchView;
