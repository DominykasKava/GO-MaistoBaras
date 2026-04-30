require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./db')

db.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER lng").catch(() => {})
db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER phone").catch(() => {})
db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS gimimo_data DATE NULL AFTER address").catch(() => {})
db.query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'laukiama_patvirtinimo'").catch(() => {})
db.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) NULL").catch(() => {})
db.query("ALTER TABLE points_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL").catch(() => {})

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/offers', require('./routes/offers'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/points', require('./routes/points'))
app.use('/api/feedback', require('./routes/feedback'))

app.get('/api', (_req, res) => res.json({ status: 'ok', app: 'Maisto App API' }))

app.use((_req, res) => res.status(404).json({ message: 'Endpoint nerastas' }))

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Maisto App API veikia: http://localhost:${PORT}/api`))
