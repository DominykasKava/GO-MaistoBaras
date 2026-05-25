const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/gerimo-pasiulymai — aktyvūs gėrimų pasiūlymai (gavejas/transportuotojas)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT gp.*, u.name AS restoranas_name, u.address AS restoranas_adresas
       FROM gerimo_pasiulymai gp
       JOIN users u ON u.id = gp.restoranas_id
       WHERE gp.statusas = 'aktyvus' AND gp.galioja_iki > NOW()
       ORDER BY gp.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/gerimo-pasiulymai/mine — restorano savi pasiūlymai
router.get('/mine', auth, async (req, res) => {
  if (req.user.role !== 'restoranas') return res.status(403).json({ message: 'Draudžiama' })
  try {
    const [rows] = await db.query(
      'SELECT * FROM gerimo_pasiulymai WHERE restoranas_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/gerimo-pasiulymai/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT gp.*, u.name AS restoranas_name, u.address AS restoranas_adresas
       FROM gerimo_pasiulymai gp
       JOIN users u ON u.id = gp.restoranas_id
       WHERE gp.id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Pasiūlymas nerastas' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/gerimo-pasiulymai — tik restoranas
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'restoranas') {
    return res.status(403).json({ message: 'Tik restoranas gali pateikti gėrimų pasiūlymus' })
  }
  const { pavadinimas, aprasymas, kiekis, kaina_taskais, transporter_points, adresas, lat, lng, galioja_iki } = req.body
  if (!pavadinimas || !kiekis) {
    return res.status(400).json({ message: 'Pavadinimas ir kiekis privalomi' })
  }
  const kaina = parseInt(kaina_taskais, 10)
  if (!kaina || kaina < 1) {
    return res.status(400).json({ message: 'Kaina taškais privaloma' })
  }
  const galiojaIki = galioja_iki
    || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
  const tPoints = Math.max(1, parseInt(transporter_points, 10) || 30)
  try {
    const [result] = await db.query(
      `INSERT INTO gerimo_pasiulymai
         (restoranas_id, pavadinimas, aprasymas, kiekis, kaina_taskais, transporter_points, adresas, lat, lng, galioja_iki)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, pavadinimas, aprasymas ?? null, kiekis, kaina, tPoints, adresas ?? null, lat ?? null, lng ?? null, galiojaIki]
    )
    const [rows] = await db.query('SELECT * FROM gerimo_pasiulymai WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// DELETE /api/gerimo-pasiulymai/:id
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'restoranas') return res.status(403).json({ message: 'Draudžiama' })
  try {
    const [rows] = await db.query('SELECT * FROM gerimo_pasiulymai WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Pasiūlymas nerastas' })
    if (rows[0].restoranas_id !== req.user.id) return res.status(403).json({ message: 'Draudžiama' })
    await db.query('DELETE FROM gerimo_pasiulymai WHERE id = ?', [req.params.id])
    res.json({ message: 'Pasiūlymas ištrintas' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
