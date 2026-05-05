const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/points/balance
router.get('/balance', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT points_balance AS balance FROM users WHERE id = ?',
      [req.user.id]
    )
    res.json(rows[0] ?? { balance: 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/points/send — siusti taškus kitam vartotojui
router.post('/send', auth, async (req, res) => {
  const { recipient_id, amount } = req.body
  const amt = parseInt(amount, 10)
  if (!recipient_id || !amt || amt < 1 || amt > 10000) {
    return res.status(400).json({ message: 'Netinkami duomenys' })
  }
  if (req.user.id === Number(recipient_id)) {
    return res.status(400).json({ message: 'Negalima siusti taškų sau' })
  }
  const conn = await require('../db').getConnection()
  try {
    await conn.beginTransaction()
    const [[sender]] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id])
    if (!sender || sender.points_balance < amt) {
      await conn.rollback()
      return res.status(400).json({ message: 'Nepakanka taškų' })
    }
    const [[recipient]] = await conn.query('SELECT id, name FROM users WHERE id = ?', [recipient_id])
    if (!recipient) {
      await conn.rollback()
      return res.status(404).json({ message: 'Gavėjas nerastas' })
    }
    await conn.query('UPDATE users SET points_balance = points_balance - ? WHERE id = ?', [amt, req.user.id])
    await conn.query('UPDATE users SET points_balance = points_balance + ? WHERE id = ?', [amt, recipient_id])
    await conn.commit()
    res.json({ message: `Išsiusti ${amt} taškai vartotojui ${recipient.name}`, new_balance: sender.points_balance - amt })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

// GET /api/points/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, role, points_balance AS points
       FROM users
       ORDER BY points_balance DESC
       LIMIT 50`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
