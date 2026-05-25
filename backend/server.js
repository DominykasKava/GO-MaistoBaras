require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./db')

db.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER lng").catch(() => {})
db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER phone").catch(() => {})
db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS gimimo_data DATE NULL AFTER address").catch(() => {})
db.query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'laukiama_patvirtinimo'").catch(() => {})
db.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) NULL").catch(() => {})
db.query("ALTER TABLE feedback MODIFY COLUMN rating VARCHAR(20) NOT NULL").catch(() => {})
db.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS transporter_points INT NOT NULL DEFAULT 30").catch(() => {})
db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7) NULL").catch(() => {})
db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7) NULL").catch(() => {})
db.query("ALTER TABLE points_transactions MODIFY COLUMN type VARCHAR(100) NOT NULL DEFAULT 'uzsakymas'").catch(() => {})
db.query(`CREATE TABLE IF NOT EXISTS gerimo_pasiulymai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restoranas_id INT NOT NULL,
  pavadinimas VARCHAR(200) NOT NULL,
  aprasymas TEXT NULL,
  kiekis VARCHAR(200) NOT NULL,
  kaina_taskais INT NOT NULL,
  transporter_points INT NOT NULL DEFAULT 30,
  adresas VARCHAR(500) NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  statusas VARCHAR(20) NOT NULL DEFAULT 'aktyvus',
  galioja_iki TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restoranas_id) REFERENCES users(id)
)`).catch(() => {})
db.query(`CREATE TABLE IF NOT EXISTS gerimo_uzsakymai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pasiulymas_id INT NOT NULL,
  gavejas_id INT NOT NULL,
  transportuotojas_id INT NULL,
  statusas VARCHAR(50) NOT NULL DEFAULT 'laukiama_patvirtinimo',
  taskai_nuskaityti INT NOT NULL,
  pristatymo_lat DECIMAL(10,7) NULL,
  pristatymo_lng DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pasiulymas_id) REFERENCES gerimo_pasiulymai(id),
  FOREIGN KEY (gavejas_id) REFERENCES users(id),
  FOREIGN KEY (transportuotojas_id) REFERENCES users(id)
)`).catch(() => {})
db.query(`CREATE TABLE IF NOT EXISTS drinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price_points INT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES users(id)
)`).catch(() => {})
db.query(`CREATE TABLE IF NOT EXISTS drink_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderer_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  total_cost INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  pickup_code VARCHAR(20) NOT NULL,
  points_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderer_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES users(id)
)`).catch(() => {})
db.query(`CREATE TABLE IF NOT EXISTS drink_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drink_order_id INT NOT NULL,
  drink_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_points INT NOT NULL,
  FOREIGN KEY (drink_order_id) REFERENCES drink_orders(id),
  FOREIGN KEY (drink_id) REFERENCES drinks(id)
)`).catch(() => {})

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/offers', require('./routes/offers'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/points', require('./routes/points'))
app.use('/api/feedback', require('./routes/feedback'))
app.use('/api/drinks', require('./routes/drinks'))
app.use('/api/gerimo-pasiulymai', require('./routes/gerimo_pasiulymai'))
app.use('/api/gerimo-uzsakymai', require('./routes/gerimo_uzsakymai'))

app.get('/api', (_req, res) => res.json({ status: 'ok', app: 'Maisto App API' }))

app.use((_req, res) => res.status(404).json({ message: 'Endpoint nerastas' }))

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Maisto App API veikia: http://localhost:${PORT}/api`))
