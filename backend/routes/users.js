const router = require('express').Router()
const bcrypt = require('bcryptjs')
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, address, gimimo_data, points_balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Vartotojas nerastas' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/users/search?q=
router.get('/search', auth, async (req, res) => {
  const q = (req.query.q ?? '').trim()
  if (q.length < 2) return res.json([])
  try {
    const [rows] = await db.query(
      'SELECT id, name, role, points_balance FROM users WHERE name LIKE ? LIMIT 20',
      [`%${q}%`]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  const { name, phone, address, gimimo_data } = req.body
  try {
    await db.query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = ?, gimimo_data = COALESCE(?, gimimo_data) WHERE id = ?',
      [name ?? null, phone ?? null, address ?? null, gimimo_data ?? null, req.user.id]
    )
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, address, gimimo_data, points_balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/users/:id — kito vartotojo profilis
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, role, points_balance, address, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Vartotojas nerastas' })
    const [feedback] = await db.query(
      `SELECT f.rating, f.comment, u.name AS from_name, f.created_at
       FROM feedback f JOIN users u ON u.id = f.from_user_id
       WHERE f.to_user_id = ? ORDER BY f.created_at DESC LIMIT 20`,
      [req.params.id]
    )
    res.json({ ...rows[0], feedback })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
