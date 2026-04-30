const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// POST /api/feedback
router.post('/', auth, async (req, res) => {
  const { order_id, reviewed_user_id, rating, comment, target_type } = req.body
  if (!order_id || !reviewed_user_id || !rating) {
    return res.status(400).json({ message: 'order_id, reviewed_user_id ir rating privalomi' })
  }
  const validRatings = ['heart', 'thumb', 'ok']
  if (!validRatings.includes(rating)) {
    return res.status(400).json({ message: 'Netinkamas įvertinimas' })
  }
  try {
    // Verify caller participated in this order and reviewed_user_id is the other party
    const [[order]] = await db.query(
      `SELECT o.gavejas_id, o.transportuotojas_id, of.user_id AS restoranas_id
       FROM orders o JOIN offers of ON of.id = o.offer_id WHERE o.id = ?`,
      [order_id]
    )
    if (!order) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const validTargets = [order.gavejas_id, order.transportuotojas_id, order.restoranas_id].filter(Boolean)
    const callerIsParticipant = validTargets.includes(req.user.id) || order.gavejas_id === req.user.id
    if (!callerIsParticipant) return res.status(403).json({ message: 'Prieiga uždrausta' })
    if (!validTargets.includes(Number(reviewed_user_id))) {
      return res.status(400).json({ message: 'Netinkamas gavėjas' })
    }
    // Prevent duplicate feedback from same user to same target for same order
    const [[dup]] = await db.query(
      'SELECT id FROM feedback WHERE order_id = ? AND from_user_id = ? AND to_user_id = ?',
      [order_id, req.user.id, reviewed_user_id]
    )
    if (dup) return res.status(409).json({ message: 'Jau įvertinote' })

    const [result] = await db.query(
      `INSERT INTO feedback (order_id, from_user_id, to_user_id, target_type, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, req.user.id, reviewed_user_id, target_type ?? 'transportuotojas', rating, comment ?? null]
    )

    // +3 taškai gavėjui už įvertinimą
    await db.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 3, 'ivertinimas')",
      [req.user.id, order_id]
    )
    await db.query('UPDATE users SET points_balance = points_balance + 3 WHERE id = ?', [req.user.id])

    // Jei gavėjas vertina transportuotoją — bonus taškai pagal įvertinimą
    if (target_type === 'transportuotojas' && req.user.role === 'gavejas') {
      const bonus = rating === 'heart' ? 10 : rating === 'thumb' ? 5 : 0
      if (bonus > 0) {
        await db.query(
          "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, ?, 'vertinimo_bonus')",
          [reviewed_user_id, order_id, bonus]
        )
        await db.query('UPDATE users SET points_balance = points_balance + ? WHERE id = ?', [bonus, reviewed_user_id])
      }
    }

    res.status(201).json({ id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/feedback/:user_id
router.get('/:user_id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, u.name AS from_name
       FROM feedback f JOIN users u ON u.id = f.from_user_id
       WHERE f.to_user_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
