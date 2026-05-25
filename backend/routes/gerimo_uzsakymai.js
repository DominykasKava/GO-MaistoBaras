const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/gerimo-uzsakymai
router.get('/', auth, async (req, res) => {
  const { id: userId, role } = req.user
  try {
    let rows
    if (role === 'restoranas') {
      ;[rows] = await db.query(
        `SELECT gu.*, gp.pavadinimas, gp.kaina_taskais, gp.adresas AS pickup_adresas,
                ug.name AS gavejas_name, ug.address AS gavejas_adresas
         FROM gerimo_uzsakymai gu
         JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id
         LEFT JOIN users ug ON ug.id = gu.gavejas_id
         WHERE gp.restoranas_id = ?
         ORDER BY gu.created_at DESC`,
        [userId]
      )
    } else {
      // gavejas arba transportuotojas: rodo savo užsakymus
      ;[rows] = await db.query(
        `SELECT gu.*, gp.pavadinimas, gp.kaina_taskais, ur.name AS restoranas_name
         FROM gerimo_uzsakymai gu
         JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id
         JOIN users ur ON ur.id = gp.restoranas_id
         WHERE gu.gavejas_id = ?
         ORDER BY gu.created_at DESC`,
        [userId]
      )
    }
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// GET /api/gerimo-uzsakymai/:id
router.get('/:id', auth, async (req, res) => {
  const { id: userId } = req.user
  try {
    const [rows] = await db.query(
      `SELECT gu.*,
              gp.pavadinimas, gp.kaina_taskais,
              gp.adresas AS pickup_adresas,
              gp.restoranas_id,
              ur.name AS restoranas_name, ur.address AS restoranas_adresas,
              ug.name AS gavejas_name, ug.address AS gavejas_adresas
       FROM gerimo_uzsakymai gu
       JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id
       JOIN users ur ON ur.id = gp.restoranas_id
       LEFT JOIN users ug ON ug.id = gu.gavejas_id
       WHERE gu.id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const row = rows[0]
    if (row.gavejas_id !== userId && row.restoranas_id !== userId) {
      return res.status(403).json({ message: 'Prieiga uždrausta' })
    }
    // Note: transportuotojas who ordered is stored as gavejas_id, so check above covers them
    res.json(row)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/gerimo-uzsakymai — gavejas arba transportuotojas užsako
router.post('/', auth, async (req, res) => {
  if (!['gavejas', 'transportuotojas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Draudžiama' })
  }
  const { pasiulymas_id } = req.body
  if (!pasiulymas_id) return res.status(400).json({ message: 'pasiulymas_id privalomas' })

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [pasiulymai] = await conn.query(
      "SELECT * FROM gerimo_pasiulymai WHERE id = ? AND statusas = 'aktyvus' AND galioja_iki > NOW() FOR UPDATE",
      [pasiulymas_id]
    )
    if (pasiulymai.length === 0) {
      await conn.rollback()
      return res.status(404).json({ message: 'Pasiūlymas nerastas arba nebegalioja' })
    }
    const pasiulymas = pasiulymai[0]

    const [existing] = await conn.query(
      "SELECT id FROM gerimo_uzsakymai WHERE pasiulymas_id = ? AND gavejas_id = ? AND statusas NOT IN ('atmesta', 'atsaukta')",
      [pasiulymas_id, req.user.id]
    )
    if (existing.length > 0) {
      await conn.rollback()
      return res.status(400).json({ message: 'Jau pateikėte užsakymą šiam pasiūlymui' })
    }

    const [userRows] = await conn.query('SELECT points_balance FROM users WHERE id = ? FOR UPDATE', [req.user.id])
    const balance = userRows[0]?.points_balance ?? 0
    if (balance < pasiulymas.kaina_taskais) {
      await conn.rollback()
      return res.status(400).json({ message: 'Nepakanka taškų užsakymui' })
    }

    await conn.query('UPDATE users SET points_balance = points_balance - ? WHERE id = ?', [pasiulymas.kaina_taskais, req.user.id])

    const [result] = await conn.query(
      `INSERT INTO gerimo_uzsakymai (pasiulymas_id, gavejas_id, statusas, taskai_nuskaityti)
       VALUES (?, ?, 'laukiama_patvirtinimo', ?)`,
      [pasiulymas_id, req.user.id, pasiulymas.kaina_taskais]
    )
    const orderId = result.insertId

    await conn.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, ?, 'gerimas_uzsakymas')",
      [req.user.id, orderId, -pasiulymas.kaina_taskais]
    )

    await conn.commit()
    const [rows] = await db.query('SELECT * FROM gerimo_uzsakymai WHERE id = ?', [orderId])
    res.status(201).json(rows[0])
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

// PUT /api/gerimo-uzsakymai/:id/confirm — restoranas patvirtina, paruošia
router.put('/:id/confirm', auth, async (req, res) => {
  if (req.user.role !== 'restoranas') return res.status(403).json({ message: 'Draudžiama' })
  try {
    const [rows] = await db.query(
      'SELECT gu.*, gp.restoranas_id FROM gerimo_uzsakymai gu JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id WHERE gu.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Užsakymas nerastas' })
    const order = rows[0]
    if (order.restoranas_id !== req.user.id) return res.status(403).json({ message: 'Draudžiama' })
    if (order.statusas !== 'laukiama_patvirtinimo') return res.status(400).json({ message: 'Neteisinga būsena' })

    await db.query("UPDATE gerimo_uzsakymai SET statusas = 'laukiama' WHERE id = ?", [order.id])
    await db.query("UPDATE gerimo_pasiulymai SET statusas = 'rezervuotas' WHERE id = ?", [order.pasiulymas_id])
    await db.query(
      "UPDATE gerimo_uzsakymai SET statusas = 'atmesta' WHERE pasiulymas_id = ? AND id != ? AND statusas = 'laukiama_patvirtinimo'",
      [order.pasiulymas_id, order.id]
    )
    await db.query("INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 5, 'patvirtinimas')", [order.gavejas_id, order.id])
    await db.query('UPDATE users SET points_balance = points_balance + 5 WHERE id = ?', [order.gavejas_id])

    const [updated] = await db.query('SELECT * FROM gerimo_uzsakymai WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// PUT /api/gerimo-uzsakymai/:id/pickup — restoranas patvirtina paėmimą su kodu
router.put('/:id/pickup', auth, async (req, res) => {
  if (!['gavejas', 'restoranas'].includes(req.user.role)) return res.status(403).json({ message: 'Draudžiama' })
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      'SELECT gu.*, gp.restoranas_id FROM gerimo_uzsakymai gu JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id WHERE gu.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Užsakymas nerastas' }) }
    const order = rows[0]
    const isOrderer = ['gavejas', 'transportuotojas'].includes(req.user.role)
    const isRestoranas = req.user.role === 'restoranas'
    if (isOrderer && order.gavejas_id !== req.user.id) { await conn.rollback(); return res.status(403).json({ message: 'Draudžiama' }) }
    if (isRestoranas && order.restoranas_id !== req.user.id) { await conn.rollback(); return res.status(403).json({ message: 'Draudžiama' }) }
    if (order.statusas !== 'laukiama') { await conn.rollback(); return res.status(400).json({ message: 'Neteisinga būsena' }) }


    await conn.query("UPDATE gerimo_uzsakymai SET statusas = 'ivykdyta' WHERE id = ?", [order.id])
    await conn.query("UPDATE gerimo_pasiulymai SET statusas = 'pabaigtas' WHERE id = ?", [order.pasiulymas_id])

    // +10 restoranui, +5 gavėjui
    if (order.restoranas_id) {
      await conn.query("INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 10, 'uzsakymas')", [order.restoranas_id, order.id])
      await conn.query('UPDATE users SET points_balance = points_balance + 10 WHERE id = ?', [order.restoranas_id])
    }
    await conn.query("INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 5, 'uzsakymas')", [order.gavejas_id, order.id])
    await conn.query('UPDATE users SET points_balance = points_balance + 5 WHERE id = ?', [order.gavejas_id])

    await conn.commit()
    const [updated] = await db.query('SELECT * FROM gerimo_uzsakymai WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

// PUT /api/gerimo-uzsakymai/:id/decline — restoranas atmeta arba gavejas atsaukia
router.put('/:id/decline', auth, async (req, res) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      'SELECT gu.*, gp.restoranas_id FROM gerimo_uzsakymai gu JOIN gerimo_pasiulymai gp ON gp.id = gu.pasiulymas_id WHERE gu.id = ?',
      [req.params.id]
    )
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Užsakymas nerastas' }) }
    const order = rows[0]
    const { role, id: userId } = req.user

    if (role === 'restoranas') {
      if (order.restoranas_id !== userId) { await conn.rollback(); return res.status(403).json({ message: 'Draudžiama' }) }
      if (order.statusas !== 'laukiama_patvirtinimo') { await conn.rollback(); return res.status(400).json({ message: 'Neteisinga būsena' }) }
      await conn.query("UPDATE gerimo_uzsakymai SET statusas = 'atmesta' WHERE id = ?", [order.id])
      await refundPoints(conn, order.id, order.gavejas_id)
    } else if (['gavejas', 'transportuotojas'].includes(role)) {
      if (order.gavejas_id !== userId) { await conn.rollback(); return res.status(403).json({ message: 'Draudžiama' }) }
      if (order.statusas !== 'laukiama_patvirtinimo') { await conn.rollback(); return res.status(400).json({ message: 'Atšaukti galima tik laukiant patvirtinimo' }) }
      await conn.query("UPDATE gerimo_uzsakymai SET statusas = 'atsaukta' WHERE id = ?", [order.id])
      await conn.query("UPDATE gerimo_pasiulymai SET statusas = 'aktyvus' WHERE id = ?", [order.pasiulymas_id])
      await refundPoints(conn, order.id, order.gavejas_id)
    } else {
      await conn.rollback(); return res.status(403).json({ message: 'Draudžiama' })
    }

    await conn.commit()
    const [updated] = await db.query('SELECT * FROM gerimo_uzsakymai WHERE id = ?', [order.id])
    res.json(updated[0])
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

async function refundPoints(conn, orderId, gavejasId) {
  const [txRows] = await conn.query(
    "SELECT ABS(amount) AS amount FROM points_transactions WHERE order_id = ? AND type = 'gerimas_uzsakymas' LIMIT 1",
    [orderId]
  )
  if (txRows.length === 0) return
  const amount = txRows[0].amount
  await conn.query(
    "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, ?, 'gerimas_grazinimas')",
    [gavejasId, orderId, amount]
  )
  await conn.query('UPDATE users SET points_balance = points_balance + ? WHERE id = ?', [amount, gavejasId])
}

module.exports = router
