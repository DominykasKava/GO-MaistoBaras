const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, gimimo_data } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Visi laukai privalomi' })
  }
  const validRoles = ['davejas', 'gavejas', 'transportuotojas', 'restoranas']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Neteisinga rolė' })
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El. paštas jau užregistruotas' })
    }
    const password_hash = await bcrypt.hash(password, 10)
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, gimimo_data) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, role, gimimo_data ?? null]
    )
    res.status(201).json({ message: 'Paskyra sukurta', id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'El. paštas ir slaptažodis privalomi' })
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Neteisingi prisijungimo duomenys' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Neteisingi prisijungimo duomenys' })
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    const { password_hash, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ message: 'Atsijungta' })
})

module.exports = router
