import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const SQL = await initSqlJs();
const Database = SQL.Database;

const dbPath = path.join(process.cwd(), 'database.db');
let db;

if (fs.existsSync(dbPath)) {
  const filebuffer = fs.readFileSync(dbPath);
  db = new Database(filebuffer);
  console.log('📂 Database ditemukan, membuka:', dbPath);
} else {
  db = new Database();
  console.log('🚀 Membuat database baru:', dbPath);
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
}

function exec(sql) {
  db.exec(sql);
}

console.log('🚀 Memulai inisialisasi database SQLite (sql.js)...');

// ==================== TABEL USERS ====================
exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Owner','Staf','Konsumen')),
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==================== TABEL CATEGORIES ====================
exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#15803d',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==================== TABEL PRODUCTS ====================
exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode TEXT,
    name TEXT NOT NULL,
    category_id TEXT,
    purchase_price REAL DEFAULT 0,
    margin_percent REAL DEFAULT 30,
    selling_price REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    conversion_factor REAL DEFAULT 1,
    stock_qty REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    date_received TEXT,
    condition TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'active',
    image_url TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// ==================== TABEL STOCK BATCHES (FIFO) ====================
exec(`
  CREATE TABLE IF NOT EXISTS stock_batches (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    qty REAL NOT NULL,
    date_received TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    remaining_qty REAL NOT NULL,
    wilting_date TEXT,
    condition TEXT DEFAULT 'normal',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ==================== TABEL PRICE HISTORY ====================
exec(`
  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    old_price REAL,
    new_price REAL NOT NULL,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    changed_by TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ==================== TABEL SUPPLIERS ====================
exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    items_supplied TEXT,
    lead_time_days INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==================== TABEL PURCHASE ORDERS ====================
exec(`
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL,
    order_date TEXT NOT NULL,
    expected_date TEXT,
    status TEXT DEFAULT 'pending',
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );
`);

// ==================== TABEL PURCHASE ORDER ITEMS ====================
exec(`
  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    po_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    qty_ordered REAL NOT NULL,
    qty_received REAL DEFAULT 0,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ==================== TABEL GOODS RECEIPTS ====================
exec(`
  CREATE TABLE IF NOT EXISTS goods_receipts (
    id TEXT PRIMARY KEY,
    receipt_no TEXT UNIQUE NOT NULL,
    po_id TEXT NOT NULL,
    received_date TEXT DEFAULT CURRENT_TIMESTAMP,
    received_by TEXT,
    condition_notes TEXT,
    total_qty REAL DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
  );
`);

// ==================== TABEL SUPPLIER DEBTS ====================
exec(`
  CREATE TABLE IF NOT EXISTS supplier_debts (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    po_id TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_paid REAL DEFAULT 0,
    due_date TEXT,
    status TEXT DEFAULT 'unpaid',
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
  );
`);

// ==================== TABEL SALES ORDERS ====================
exec(`
  CREATE TABLE IF NOT EXISTS sales_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash',
    shipping_provider TEXT DEFAULT '-',
    pickup_time TEXT,
    shipping_cost REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    payment_proof_url TEXT,
    invoice_number TEXT,
    confirmed_at TEXT,
    confirmed_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==================== TABEL SALES ORDER ITEMS ====================
exec(`
  CREATE TABLE IF NOT EXISTS sales_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    price_type TEXT DEFAULT 'normal',
    FOREIGN KEY (order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ==================== TABEL CASH FLOW ====================
exec(`
  CREATE TABLE IF NOT EXISTS cash_flow (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('in','out')),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_id TEXT,
    description TEXT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    recorded_by TEXT
  );
`);

// ==================== TABEL CUSTOMERS ====================
exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    category TEXT DEFAULT 'Rumah Tangga',
    segment TEXT DEFAULT 'Silver',
    total_spend REAL DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_order TEXT
  );
`);

// ==================== TABEL LOYALTY ====================
exec(`
  CREATE TABLE IF NOT EXISTS loyalty (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    order_id TEXT,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    balance INTEGER DEFAULT 0,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    type TEXT DEFAULT 'earn',
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
`);

// ==================== TABEL COMPLAINTS ====================
exec(`
  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    order_id TEXT,
    product_id TEXT,
    complaint_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'open',
    follow_up_action TEXT,
    stock_adjusted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
  );
`);

// ==================== TABEL WEATHER LOGS ====================
exec(`
  CREATE TABLE IF NOT EXISTS weather_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    condition TEXT,
    correlation_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==================== HELPER: UUID SIMPLE ====================
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function nowISO() {
  return new Date().toISOString();
}

// ==================== SEED DATA AWAL ====================
const insertUser = db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password, role, phone, active, created_at) VALUES (?,?,?,?,?,?,?,?)`);
insertUser.run(['u1', 'Owner Warung Sayur', 'owner@warungsayur.com', 'owner123', 'Owner', '08123456789', 1, nowISO()]);
insertUser.run(['u2', 'Staf Kasir', 'staf@warungsayur.com', 'staf123', 'Staf', '08123456780', 1, nowISO()]);
insertUser.run(['u3', 'Pelanggan Demo', 'beli@email.com', 'beli123', 'Konsumen', '08123456791', 1, nowISO()]);

const catInsert = db.prepare(`INSERT OR IGNORE INTO categories (id, name, description, color, created_at) VALUES (?,?,?,?,?)`);
const cats = [
  ['c1','Sayuran','Sayuran segar dari petani lokal','#15803d',nowISO()],
  ['c2','Bumbu Dapur','Bumbu masak dan rempah','#166534',nowISO()],
  ['c3','Makanan Beku','Produk frozen dan beku','#0f766e',nowISO()],
  ['c4','Daging','Daging segar dan olahan daging','#059669',nowISO()],
  ['c5','Sembako','Beras, telur, minyak, gula','#14532d',nowISO()],
  ['c6','Buah-buahan','Buah segar impor dan lokal','#15803d',nowISO()],
  ['c7','Produk Olahan','Olahan sayur dan tempe tahu','#065f46',nowISO()]
];
cats.forEach(c => catInsert.run(c));

const prodInsert = db.prepare(`INSERT OR IGNORE INTO products (id, barcode, name, category_id, purchase_price, margin_percent, selling_price, unit, conversion_factor, stock_qty, min_stock, date_received, condition, status, image_url, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const products = [
  ['p1','BRG001','Bayam','c1',8000,30,10400,'kg',1,50,5,'2026-11-20','normal','active','',nowISO()],
  ['p2','BRG002','Wortel','c1',6000,35,8100,'kg',1,40,5,'2026-11-19','normal','active','',nowISO()],
  ['p3','BRG003','Beras Medium','c5',12000,15,13800,'kg',1,100,10,'2026-11-18','normal','active','',nowISO()],
  ['p4','BRG004','Ayam Fillet','c4',45000,20,54000,'kg',1,20,3,'2026-11-21','normal','active','',nowISO()],
  ['p5','BRG005','Telur Ayam','c5',2200,10,2420,'pcs',1,200,20,'2026-11-20','normal','active','',nowISO()],
  ['p6','BRG006','Minyak Goreng','c5',14000,12,15680,'dus',12,30,5,'2026-11-15','normal','active','',nowISO()],
  ['p7','BRG007','Bawang Merah','c1',35000,25,43750,'kg',1,25,3,'2026-11-19','normal','active','',nowISO()],
  ['p8','BRG008','Cabe Rawit','c1',60000,30,78000,'kg',1,10,2,'2026-11-21','normal','active','',nowISO()]
];
products.forEach(p => prodInsert.run(p));

const batchInsert = db.prepare(`INSERT OR IGNORE INTO stock_batches (id, product_id, qty, date_received, purchase_price, remaining_qty, wilting_date, condition, created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
const batches = [
  ['b1','p1',50,'2026-11-20',8000,50,'2026-11-23','normal',nowISO()],
  ['b2','p2',40,'2026-11-19',6000,40,'2026-11-22','normal',nowISO()],
  ['b3','p3',100,'2026-11-18',12000,100,'2026-11-25','normal',nowISO()],
  ['b4','p4',20,'2026-11-21',45000,20,'2026-11-24','normal',nowISO()],
  ['b5','p5',200,'2026-11-20',2200,200,'2026-11-25','normal',nowISO()],
  ['b6','p6',30,'2026-11-15',14000,30,'2026-11-22','normal',nowISO()],
  ['b7','p7',25,'2026-11-19',35000,25,'2026-11-22','normal',nowISO()],
  ['b8','p8',10,'2026-11-21',60000,10,'2026-11-24','normal',nowISO()]
];
batches.forEach(b => batchInsert.run(b));

const suppInsert = db.prepare(`INSERT OR IGNORE INTO suppliers (id, name, contact_person, phone, email, address, items_supplied, lead_time_days, created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
const suppliers = [
  ['s1','CV Tani Segar','Budi','0811111111','budi@tanisegar.id','Jakarta','Sayuran, Buah',2,nowISO()],
  ['s2','PD Sembako Jaya','Siti','0822222222','siti@sembakojaya.id','Tangerang','Beras, Telur, Minyak',1,nowISO()],
  ['s3','CV Daging Nusantara','Andi','0833333333','andi@dagingnus.id','Bogor','Daging',3,nowISO()]
];
suppliers.forEach(s => suppInsert.run(s));

const custInsert = db.prepare(`INSERT OR IGNORE INTO customers (id, name, phone, email, address, category, segment, total_spend, points, created_at, last_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
const customers = [
  ['cust1','Budi Santoso','0811111111','budi@email.com','Jakarta','Rumah Tangga','Silver',150000,50,nowISO(),nowISO()],
  ['cust2','Siti Rahayu','0822222222','siti@email.com','Tangerang','Mitra Kuliner','Gold',450000,150,nowISO(),nowISO()]
];
customers.forEach(c => custInsert.run(c));

const cashInsert = db.prepare(`INSERT OR IGNORE INTO cash_flow (id, type, category, amount, reference_id, description, date, recorded_by) VALUES (?,?,?,?,?,?,?,?)`);
cashInsert.run(['cf1','in','modal_awal',10000000,'','Modal awal usaha','2026-11-01','u1']);

// Simpan ke file
fs.writeFileSync(dbPath, Buffer.from(db.export()));
console.log('✅ Database dan data dummy berhasil dibuat di', dbPath);
db.close();
