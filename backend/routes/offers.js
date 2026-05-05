const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/offers?lat=&lng=&radius=
router.get('/', auth, async (req, res) => {
  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  const radius = parseFloat(req.query.radius) || 10

  try {
    let query, params
    if (!isNaN(lat) && !isNaN(lng)) {
      // Haversine distance in km
      query = `
        SELECT o.*, u.name AS owner_name, u.role AS owner_role,
          (6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(o.lat)) *
            COS(RADIANS(o.lng) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(o.lat))
          )) AS distance
        FROM offers o
        JOIN users u ON u.id = o.user_id
        WHERE o.status = 'aktyvus'
          AND o.expires_at > NOW()
          AND (o.lat IS NULL OR (
            6371 * ACOS(
              COS(RADIANS(?)) * COS(RADIANS(o.lat)) *
              COS(RADIANS(o.lng) - RADIANS(?)) +
              SIN(RADIANS(?)) * SIN(RADIANS(o.lat))
            ) <= ?
          ))
        ORDER BY distance ASC
      `
      params = [lat, lng, lat, lat, lng, lat, radius]
    } else {
      query = `
        SELECT o.*, u.name AS owner_name, u.role AS owner_role
        FROM offers o
        JOIN users u ON u.id = o.user_id
        WHERE o.status = 'aktyvus' AND o.expires_at > NOW()
        ORDER BY o.created_at DESC
      `
      params = []
    }
    const [rows] = await db.query(query, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/offers/mine  — restoranas savo pasiūlymai
router.get('/mine', auth, async (req, res) => {
  if (!['davejas', 'restoranas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Draudžiama' })
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM offers WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// DELETE /api/offers/:id
router.delete('/:id', auth, async (req, res) => {
  if (!['davejas', 'restoranas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Draudžiama' })
  }
  try {
    const [rows] = await db.query('SELECT * FROM offers WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Pasiūlymas nerastas' })
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Draudžiama' })
    await db.query('DELETE FROM offers WHERE id = ?', [req.params.id])
    res.json({ message: 'Pasiūlymas ištrintas' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/offers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, u.name AS owner_name, u.role AS owner_role
       FROM offers o JOIN users u ON u.id = o.user_id
       WHERE o.id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Pasiūlymas nerastas' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/offers  (tik davejas / restoranas)
router.post('/', auth, async (req, res) => {
  if (!['davejas', 'restoranas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Tik davėjai gali kurti pasiūlymus' })
  }
  const { title, quantity, expires_at, lat, lng, address } = req.body
  if (!title || !quantity) {
    return res.status(400).json({ message: 'Pavadinimas ir kiekis privalomi' })
  }
  const expiresAt = expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
  try {
    const [result] = await db.query(
      'INSERT INTO offers (user_id, title, quantity, expires_at, lat, lng, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, quantity, expiresAt, lat ?? null, lng ?? null, address ?? null]
    )
    const [rows] = await db.query('SELECT * FROM offers WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
