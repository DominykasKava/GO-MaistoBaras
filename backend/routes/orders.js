const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const role = req.user.role
    let rows
    if (role === 'davejas' || role === 'restoranas') {
      ;[rows] = await db.query(
        `SELECT o.*, of.title AS offer_title, of.quantity AS offer_quantity,
                ug.name AS gavejas_name, ug.address AS gavejas_address
         FROM orders o
         JOIN offers of ON of.id = o.offer_id
         LEFT JOIN users ug ON ug.id = o.gavejas_id
         WHERE of.user_id = ? ORDER BY o.created_at DESC`,
        [userId]
      )
    } else if (role === 'transportuotojas') {
      ;[rows] = await db.query(
        `SELECT o.*, of.title AS offer_title, of.address AS pickup_address,
                of.lat AS offer_lat, of.lng AS offer_lng,
                ug.address AS delivery_address
         FROM orders o
         JOIN offers of ON of.id = o.offer_id
         LEFT JOIN users ug ON ug.id = o.gavejas_id
         WHERE o.status = 'laukiama'
            OR (o.transportuotojas_id = ? AND o.status IN ('pristatoma', 'ivykdyta', 'atsaukta'))
         ORDER BY o.created_at DESC`,
        [userId]
      )
    } else {
      ;[rows] = await db.query(
        `SELECT o.*, of.title AS offer_title
         FROM orders o JOIN offers of ON of.id = o.offer_id
         WHERE o.gavejas_id = ? ORDER BY o.created_at DESC`,
        [userId]
      )
    }
    res.json(rows.map((r) => ({ ...r, offer: { title: r.offer_title, quantity: r.offer_quantity } })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*,
              of.title AS offer_title, of.lat AS offer_lat, of.lng AS offer_lng,
              of.address AS pickup_address, of.user_id AS restoranas_id,
              ug.address AS delivery_address, ug.name AS gavejas_name,
              (SELECT COUNT(*) FROM feedback WHERE order_id = o.id AND from_user_id = ? AND to_user_id = o.transportuotojas_id) AS has_feedback_transport,
              (SELECT COUNT(*) FROM feedback WHERE order_id = o.id AND from_user_id = ? AND to_user_id = of.user_id) AS has_feedback_restoranas
       FROM orders o
       JOIN offers of ON of.id = o.offer_id
       LEFT JOIN users ug ON ug.id = o.gavejas_id
       WHERE o.id = ?`,
      [req.user.id, req.user.id, req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const row = rows[0]
    const uid = req.user.id
    const role = req.user.role
    const isParticipant = row.gavejas_id === uid || row.restoranas_id === uid || row.transportuotojas_id === uid
    // Transportuotojas gali matyti laukiama užsakymus (dar nėra priskirtas)
    const canViewAsTransportuotojas = role === 'transportuotojas' && row.status === 'laukiama'
    if (!isParticipant && !canViewAsTransportuotojas) return res.status(403).json({ message: 'Prieiga uždrausta' })
    res.json({
      ...row,
      has_feedback_transport: row.has_feedback_transport > 0,
      has_feedback_restoranas: row.has_feedback_restoranas > 0,
      offer: { title: row.offer_title, lat: row.offer_lat, lng: row.offer_lng, address: row.pickup_address },
      pickup_address: row.pickup_address,
      delivery_address: row.delivery_address,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/orders — gavėjas pateikia užsakymą (laukiama_patvirtinimo)
router.post('/', auth, async (req, res) => {
  if (!['gavejas', 'transportuotojas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Tik gavėjai gali pateikti užsakymus' })
  }
  const { offer_id } = req.body
  if (!offer_id) return res.status(400).json({ message: 'offer_id privalomas' })
  try {
    const [offers] = await db.query(
      "SELECT * FROM offers WHERE id = ? AND status = 'aktyvus' AND expires_at > NOW()",
      [offer_id]
    )
    if (offers.length === 0) {
      return res.status(404).json({ message: 'Pasiūlymas nerastas arba nebegalioja' })
    }
    const [existing] = await db.query(
      "SELECT id FROM orders WHERE offer_id = ? AND gavejas_id = ? AND status NOT IN ('atmesta', 'atsaukta')",
      [offer_id, req.user.id]
    )
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Jau pateikėte užsakymą šiam pasiūlymui' })
    }
    const [result] = await db.query(
      "INSERT INTO orders (offer_id, gavejas_id, status) VALUES (?, ?, 'laukiama_patvirtinimo')",
      [offer_id, req.user.id]
    )
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/orders/:id/confirm — restoranas patvirtina gavėją
router.put('/:id/confirm', auth, async (req, res) => {
  if (!['restoranas', 'davejas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Draudžiama' })
  }
  try {
    const [rows] = await db.query(
      'SELECT o.*, of.user_id AS offer_user_id FROM orders o JOIN offers of ON of.id = o.offer_id WHERE o.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const order = rows[0]
    if (order.offer_user_id !== req.user.id) return res.status(403).json({ message: 'Draudžiama' })
    if (order.status !== 'laukiama_patvirtinimo') return res.status(400).json({ message: 'Neteisinga būsena' })

    await db.query("UPDATE orders SET status = 'laukiama' WHERE id = ?", [order.id])
    await db.query("UPDATE offers SET status = 'rezervuotas' WHERE id = ?", [order.offer_id])
    await db.query(
      "UPDATE orders SET status = 'atmesta' WHERE offer_id = ? AND id != ? AND status = 'laukiama_patvirtinimo'",
      [order.offer_id, order.id]
    )
    // Gavėjas gauna +5 taškų kai patvirtinama
    await db.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 5, 'patvirtinimas')",
      [order.gavejas_id, order.id]
    )
    await db.query('UPDATE users SET points_balance = points_balance + 5 WHERE id = ?', [order.gavejas_id])

    const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/orders/:id/confirm-delivery — transportuotojas priima arba patvirtina pristatymą
router.put('/:id/confirm-delivery', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT o.*, of.user_id AS davejas_id FROM orders o JOIN offers of ON of.id = o.offer_id WHERE o.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const order = rows[0]
    const { role, id: userId } = req.user

    if (role === 'transportuotojas') {
      if (order.status === 'laukiama') {
        await db.query(
          "UPDATE orders SET status = 'pristatoma', transportuotojas_id = ? WHERE id = ?",
          [userId, order.id]
        )
        // Transportuotojas gauna 20% (10 taškų) priėmęs užsakymą
        await db.query(
          "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 10, 'priemimas')",
          [userId, order.id]
        )
        await db.query('UPDATE users SET points_balance = points_balance + 10 WHERE id = ?', [userId])
      } else if (order.status === 'pristatoma' && order.transportuotojas_id === userId) {
        await db.query("UPDATE orders SET status = 'ivykdyta' WHERE id = ?", [order.id])
        await addDeliverPoints(order.id, order.gavejas_id, userId, order.davejas_id)
      } else {
        return res.status(400).json({ message: 'Neteisinga būsena' })
      }
    } else {
      return res.status(403).json({ message: 'Draudžiama' })
    }

    const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/orders/:id/confirm-receipt — gavėjas patvirtina gavimą
router.put('/:id/confirm-receipt', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT o.*, of.user_id AS davejas_id FROM orders o JOIN offers of ON of.id = o.offer_id WHERE o.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const order = rows[0]
    if (order.gavejas_id !== req.user.id) return res.status(403).json({ message: 'Draudžiama' })
    if (!['pristatoma', 'patvirtinta'].includes(order.status)) {
      return res.status(400).json({ message: 'Neteisinga būsena' })
    }
    await db.query("UPDATE orders SET status = 'ivykdyta' WHERE id = ?", [order.id])
    await addDeliverPoints(order.id, order.gavejas_id, order.transportuotojas_id, order.davejas_id)
    const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/orders/:id/decline — transportuotojas arba restoranas atmeta
router.put('/:id/decline', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT o.*, of.user_id AS offer_user_id FROM orders o JOIN offers of ON of.id = o.offer_id WHERE o.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const order = rows[0]
    const { role, id: userId } = req.user

    if (role === 'transportuotojas') {
      if (order.status !== 'laukiama') return res.status(400).json({ message: 'Neteisinga būsena' })
      await db.query("UPDATE orders SET status = 'atsaukta' WHERE id = ?", [order.id])
      await db.query("UPDATE offers SET status = 'aktyvus' WHERE id = ?", [order.offer_id])
    } else if (role === 'restoranas' || role === 'davejas') {
      if (order.offer_user_id !== userId) return res.status(403).json({ message: 'Draudžiama' })
      if (order.status !== 'laukiama_patvirtinimo') return res.status(400).json({ message: 'Neteisinga būsena' })
      await db.query("UPDATE orders SET status = 'atmesta' WHERE id = ?", [order.id])
    } else {
      return res.status(403).json({ message: 'Draudžiama' })
    }

    const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// Transportuotojas: 60% (30 taškų) už pristatymą + davejas +10 + gavejas +5
async function addDeliverPoints(orderId, gavejasId, transportuotojasId, davejasId) {
  const conn = await require('../db').getConnection()
  try {
    await conn.beginTransaction()
    if (davejasId) {
      await conn.query(
        "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 10, 'uzsakymas')",
        [davejasId, orderId]
      )
      await conn.query('UPDATE users SET points_balance = points_balance + 10 WHERE id = ?', [davejasId])
    }
    if (gavejasId) {
      await conn.query(
        "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 5, 'uzsakymas')",
        [gavejasId, orderId]
      )
      await conn.query('UPDATE users SET points_balance = points_balance + 5 WHERE id = ?', [gavejasId])
    }
    if (transportuotojasId) {
      // 60% = 30 taškų
      await conn.query(
        "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 30, 'pristatymas')",
        [transportuotojasId, orderId]
      )
      await conn.query('UPDATE users SET points_balance = points_balance + 30 WHERE id = ?', [transportuotojasId])
    }
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = router
