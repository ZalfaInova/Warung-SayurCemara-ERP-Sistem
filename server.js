import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import multer from 'multer';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

const SQL = await initSqlJs();
const Database = SQL.Database;

const app = express();
const PORT = 3000;

const dbPath = path.join(process.cwd(), 'database.db');
let db;

if (fs.existsSync(dbPath)) {
  const filebuffer = fs.readFileSync(dbPath);
  db = new Database(filebuffer);
  console.log('📂 Database dibuka:', dbPath);
} else {
  db = new Database();
  console.log('🚀 Database baru dibuat (jalankan node init-db.js untuk seed data)');
}

function saveDb() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.all(params);
  stmt.free();
  return result;
}

function queryGet(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.get(params);
  stmt.free();
  return result;
}

function queryRun(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  stmt.free();
  saveDb();
  return result;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

const uploadsDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function nowISO() {
  return new Date().toISOString();
}
function formatDateOnly(d = new Date()) {
  return d.toISOString().split('T')[0];
}

const allowedTables = [
  'users','categories','products','stock_batches','price_history',
  'suppliers','purchase_orders','purchase_order_items','goods_receipts',
  'supplier_debts','sales_orders','sales_order_items','cash_flow',
  'customers','loyalty','complaints','weather_logs'
];

app.get('/api/data/:table', (req, res) => {
  const { table } = req.params;
  if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Tabel tidak valid' });
  try {
    const rows = queryAll(`SELECT * FROM ${table}`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save', (req, res) => {
  const { table, id, ...fields } = req.body;
  if (!table || !id) return res.status(400).json({ error: 'table dan id wajib diisi' });
  try {
    const existing = queryGet(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (existing) {
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      queryRun(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, id]);
      res.json({ success: true, id, action: 'updated' });
    } else {
      queryRun(`INSERT INTO ${table} (id, ${keys.join(', ')}) VALUES (?, ${keys.map(() => '?').join(', ')})`, [id, ...values]);
      res.json({ success: true, id, action: 'created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/remove', (req, res) => {
  const { table, id } = req.body;
  try {
    const info = queryRun(`DELETE FROM ${table} WHERE id = ?`, [id]);
    res.json({ success: true, deleted: info.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = queryGet('SELECT * FROM users WHERE email = ? AND password = ? AND active = 1', [email, password]);
  if (!user) return res.status(401).json({ error: 'Email, password, atau role salah' });
  if (user.role !== role) return res.status(401).json({ error: 'Role tidak sesuai dengan akun' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
});

app.post('/api/dynamic-price', (req, res) => {
  const { productId, qty, marginPercent } = req.body;
  const product = queryGet('SELECT * FROM products WHERE id = ? OR barcode = ?', [productId, productId]);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const pp = parseFloat(product.purchase_price || 0);
  const margin = marginPercent !== undefined ? parseFloat(marginPercent) : parseFloat(product.margin_percent || 30);
  const base = pp * (1 + margin / 100);
  const unit = product.unit || 'kg';
  const conv = parseFloat(product.conversion_factor || 1);
  const quantity = parseFloat(qty || 1);

  let perUnit = base;
  if (unit === 'dus' && conv > 1) perUnit = base / conv;
  if (unit === 'gram') perUnit = base / 1000;

  let total = perUnit * quantity;
  if (quantity >= 50) total *= 0.88;
  else if (quantity >= 10) total *= 0.95;
  else if (quantity >= 5) total *= 0.98;

  res.json({
    success: true,
    product: product.name,
    purchase_price: pp,
    margin_percent: margin,
    selling_price_per_unit: Math.round(perUnit * 100) / 100,
    total_price: Math.round(total * 100) / 100,
    unit,
    qty: quantity
  });
});

app.post('/api/checkout', upload.single('payment_proof'), (req, res) => {
  const { items, customer_id, user_id, payment_method, shipping_provider, pickup_time, shipping_cost, total_amount, paid_amount, payment_proof_url } = req.body;
  const id = genId();
  const orderNumber = 'INV-' + id;
  const invoiceNumber = 'INV-' + id;
  const proofUrl = req.file ? '/uploads/' + req.file.filename : (payment_proof_url || '');
  const status = payment_method === 'qris' ? 'pending_payment' : 'paid';

  const insertOrder = db.prepare(`INSERT INTO sales_orders (id, order_number, customer_id, user_id, order_date, status, payment_method, shipping_provider, pickup_time, shipping_cost, total_amount, paid_amount, payment_proof_url, invoice_number, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  insertOrder.run([id, orderNumber, customer_id || null, user_id, nowISO(), status, payment_method, shipping_provider || '-', pickup_time || null, parseFloat(shipping_cost || 0), parseFloat(total_amount || 0), parseFloat(paid_amount || 0), proofUrl, invoiceNumber, nowISO(), nowISO()]);
  insertOrder.free();

  const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
  const insertItem = db.prepare(`INSERT INTO sales_order_items (id, order_id, product_id, qty, unit_price, subtotal, price_type) VALUES (?,?,?,?,?,?,?)`);
  itemsArray.forEach(it => {
    const itemId = genId();
    insertItem.run([itemId, id, it.product_id, it.qty, it.unit_price, it.subtotal, it.price_type || 'normal']);
  });
  insertItem.free();
  saveDb();

  if (status === 'paid') {
    deductFIFO(itemsArray);
    const cashInsert = db.prepare(`INSERT INTO cash_flow (id, type, category, amount, reference_id, description, date, recorded_by) VALUES (?,?,?,?,?,?,?,?)`);
    cashInsert.run([genId(), 'in', 'sales', parseFloat(total_amount || 0), id, 'Penjualan ' + orderNumber, nowISO(), user_id]);
    cashInsert.free();
    updateLoyalty(customer_id, parseFloat(total_amount || 0), id);
    saveDb();
  }

  res.json({ success: true, orderId: id, invoiceNumber, orderNumber, status });
});

function deductFIFO(items) {
  const updateBatch = db.prepare(`UPDATE stock_batches SET remaining_qty = remaining_qty - ? WHERE id = ?`);
  const updateProduct = db.prepare(`UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?`);
  items.forEach(it => {
    let need = parseFloat(it.qty || 0);
    const batches = queryAll(`SELECT * FROM stock_batches WHERE product_id = ? AND remaining_qty > 0 ORDER BY date_received ASC`, [it.product_id]);
    batches.forEach(b => {
      if (need <= 0) return;
      const take = Math.min(need, parseFloat(b.remaining_qty || 0));
      updateBatch.run([take, b.id]);
      need -= take;
    });
    updateProduct.run([parseFloat(it.qty || 0), it.product_id]);
  });
  updateBatch.free();
  updateProduct.free();
  saveDb();
}

function updateLoyalty(customerId, total, orderId) {
  if (!customerId) return;
  const cust = queryGet('SELECT * FROM customers WHERE id = ?', [customerId]);
  if (!cust) return;
  const pointsEarned = Math.floor(total / 10000);
  const newTotal = parseFloat(cust.total_spend || 0) + total;
  const newPoints = parseInt(cust.points || 0) + pointsEarned;
  let segment = cust.segment;
  if (newTotal >= 1000000) segment = 'Platinum';
  else if (newTotal >= 500000) segment = 'Gold';
  else if (newTotal >= 200000) segment = 'Silver';
  queryRun(`UPDATE customers SET total_spend = ?, points = ?, segment = ?, last_order = ? WHERE id = ?`, [newTotal, newPoints, segment, nowISO(), customerId]);
  queryRun(`INSERT INTO loyalty (id, customer_id, order_id, points_earned, points_used, balance, date, type) VALUES (?,?,?,?,?,?,?,?)`, [genId(), customerId, orderId, pointsEarned, 0, newPoints, nowISO(), 'earn']);
}

app.post('/api/receive', (req, res) => {
  const { po_id, received_by, notes, total_qty } = req.body;
  const id = genId();
  const receiptNo = 'REC-' + id;
  queryRun(`INSERT INTO goods_receipts (id, receipt_no, po_id, received_date, received_by, condition_notes, total_qty) VALUES (?,?,?,?,?,?,?)`, [id, receiptNo, po_id, nowISO(), received_by, notes || '', parseFloat(total_qty || 0)]);
  queryRun(`UPDATE purchase_orders SET status = 'received' WHERE id = ?`, [po_id]);

  const po = queryGet('SELECT * FROM purchase_orders WHERE id = ?', [po_id]);
  if (po) {
    queryRun(`INSERT INTO supplier_debts (id, supplier_id, po_id, amount, amount_paid, due_date, status) VALUES (?,?,?,?,?,?,?)`, [genId(), po.supplier_id, po_id, parseFloat(po.total_amount || 0), 0, po.expected_date || null, 'unpaid']);
    queryRun(`INSERT INTO cash_flow (id, type, category, amount, reference_id, description, date, recorded_by) VALUES (?,?,?,?,?,?,?,?)`, [genId(), 'out', 'supplier_debt', parseFloat(po.total_amount || 0), po_id, 'Tagihan pemasok PO ' + po.po_number, nowISO(), received_by]);
  }

  const items = queryAll(`SELECT * FROM purchase_order_items WHERE po_id = ?`, [po_id]);
  items.forEach(it => {
    const batchId = genId();
    queryRun(`INSERT INTO stock_batches (id, product_id, qty, date_received, purchase_price, remaining_qty, wilting_date, condition, created_at) VALUES (?,?,?,?,?,?,?,?,?)`, [
      batchId, it.product_id, it.qty_ordered, nowISO(), it.unit_price, it.qty_ordered,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'normal', nowISO()
    ]);
    queryRun(`UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`, [it.qty_ordered, it.product_id]);
  });

  res.json({ success: true, receiptId: id, receiptNo });
});

app.post('/api/pay-debt', (req, res) => {
  const { id, supplier_id, po_id, amount, due_date, recorded_by } = req.body;
  const debtId = genId();
  queryRun(`INSERT INTO supplier_debts (id, supplier_id, po_id, amount, amount_paid, due_date, status) VALUES (?,?,?,?,?,?,?)`, [debtId, supplier_id, po_id, parseFloat(amount), parseFloat(amount), due_date || null, 'paid']);
  queryRun(`UPDATE purchase_orders SET status = 'paid' WHERE id = ?`, [po_id]);
  queryRun(`INSERT INTO cash_flow (id, type, category, amount, reference_id, description, date, recorded_by) VALUES (?,?,?,?,?,?,?,?)`, [genId(), 'out', 'supplier_payment', parseFloat(amount), po_id, 'Pembayaran utang pemasok', nowISO(), recorded_by]);
  res.json({ success: true, debtId });
});

app.post('/api/complaint', (req, res) => {
  const { id, customer_id, order_id, product_id, complaint_type, description } = req.body;
  queryRun(`INSERT INTO complaints (id, customer_id, order_id, product_id, complaint_type, description, status, stock_adjusted, created_at) VALUES (?,?,?,?,?,?,?,?,?)`, [
    id, customer_id, order_id, product_id, complaint_type, description, 'open', 0, nowISO()
  ]);
  res.json({ success: true, complaintId: id });
});

app.get('/api/analytics', (req, res) => {
  const orders = queryAll('SELECT * FROM sales_orders WHERE status = ?', ['paid']);
  const items = queryAll('SELECT * FROM sales_order_items');
  const products = queryAll('SELECT * FROM products');
  const users = queryAll('SELECT * FROM users');

  const now = new Date();
  const last7 = orders.filter(o => {
    const d = new Date(o.created_at);
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  });

  const revenue = last7.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const byCashier = {};
  last7.forEach(o => { byCashier[o.user_id] = (byCashier[o.user_id] || 0) + parseFloat(o.total_amount || 0); });
  const bestCashierEntry = Object.entries(byCashier).sort((a, b) => b[1] - a[1])[0];
  const cashierName = bestCashierEntry ? (users.find(u => u.id === bestCashierEntry[0]) || { name: '-' }).name : '-';

  const prodSold = {};
  items.forEach(it => { prodSold[it.product_id] = (prodSold[it.product_id] || 0) + parseFloat(it.qty || 0); });
  const bestProducts = Object.entries(prodSold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([pid, q]) => {
    const p = products.find(x => x.id === pid);
    return { name: p ? p.name : '-', qty: q };
  });

  res.json({ success: true, revenue_7d: revenue, total_orders: last7.length, best_cashier: cashierName, best_products: bestProducts });
});

app.get('/api/weather', async (req, res) => {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.0&longitude=110.4333&current_weather=true&hourly=relativehumidity_2m');
    const data = await response.json();
    const log = {
      id: genId(),
      date: formatDateOnly(),
      temperature: data.current_weather?.temperature || null,
      humidity: data.current_weather?.windspeed || null,
      condition: data.current_weather?.weathercode ? 'cerah' : 'tidak diketahui',
      correlation_notes: '',
      created_at: nowISO()
    };
    queryRun(`INSERT INTO weather_logs (id, date, temperature, humidity, condition, correlation_notes, created_at) VALUES (?,?,?,?,?,?,?)`, [log.id, log.date, log.temperature, log.humidity, log.condition, log.correlation_notes, log.created_at]);
    res.json({ success: true, weather: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function checkWilting() {
  const category = queryGet("SELECT id FROM categories WHERE name = 'Sayuran'");
  if (!category) return 0;
  const products = queryAll(`SELECT * FROM products WHERE category_id = ?`, [category.id]);
  let flagged = 0;
  const today = new Date();
  products.forEach(p => {
    const dr = p.date_received ? new Date(p.date_received) : today;
    const days = (today - dr) / (1000 * 60 * 60 * 24);
    if (days >= 2 && p.condition !== 'rotting' && p.status !== 'on_sale') {
      queryRun(`UPDATE products SET condition = 'wilting', status = 'on_sale' WHERE id = ?`, [p.id]);
      flagged++;
    }
  });
  return flagged;
}

app.post('/api/wilting-check', (req, res) => {
  const flagged = checkWilting();
  res.json({ success: true, flagged, message: 'Cek stok layam selesai' });
});

cron.schedule('0 16 * * *', () => {
  console.log('[Cron 16:00] Menjalankan pengecekan stok layam...');
  const flagged = checkWilting();
  console.log(`[Cron] ${flagged} produk ditandai layam/on_sale`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📦 Database: ${dbPath}`);
});
