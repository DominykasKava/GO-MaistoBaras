const router = require('express').Router()
const crypto = require('crypto')
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/drinks/catalog
router.get('/catalog', auth, async (req, res) => {
  try {
    const [drinks] = await db.query(
      `SELECT d.*, u.name AS restaurant_name, u.address AS restaurant_address, u.id AS restaurant_id
       FROM drinks d JOIN users u ON u.id = d.restaurant_id
       WHERE d.available = TRUE AND u.role = 'restoranas'
       ORDER BY u.name, d.name`
    )

    const grouped = {}
    for (const d of drinks) {
      if (!grouped[d.restaurant_id]) {
        grouped[d.restaurant_id] = {
          restaurant: { id: d.restaurant_id, name: d.restaurant_name, address: d.restaurant_address },
          drinks: [],
        }
      }
      grouped[d.restaurant_id].drinks.push({
        id: d.id,
        name: d.name,
        description: d.description,
        price_points: d.price_points,
      })
    }

    res.json(Object.values(grouped))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

// POST /api/drinks/order
router.post('/order', auth, async (req, res) => {
  const { restaurant_id, items } = req.body
  const allowedRoles = ['gavejas', 'transportuotojas']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Prieiga uždrausta' })
  }
  if (!restaurant_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'restaurant_id ir items privalomi' })
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const drinkIds = items.map((i) => i.drink_id)
    const [dbDrinks] = await conn.query(
      `SELECT id, price_points FROM drinks WHERE id IN (?) AND restaurant_id = ? AND available = TRUE`,
      [drinkIds, restaurant_id]
    )

    if (dbDrinks.length !== drinkIds.length) {
      await conn.rollback()
      return res.status(400).json({ message: 'Kai kurie gėrimai nerasti arba neprieinami' })
    }

    const priceMap = Object.fromEntries(dbDrinks.map((d) => [d.id, d.price_points]))
    const totalCost = items.reduce((sum, i) => sum + (priceMap[i.drink_id] ?? 0) * i.quantity, 0)

    const [[user]] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id])
    if ((user?.points_balance ?? 0) < totalCost) {
      await conn.rollback()
      return res.status(400).json({ message: 'Nepakanka taškų' })
    }

    const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase()
    const code = `${rawCode.slice(0, 3)}-${rawCode.slice(3)}`

    const [orderResult] = await conn.query(
      `INSERT INTO drink_orders (orderer_id, restaurant_id, total_cost, status, pickup_code)
       VALUES (?, ?, ?, 'pending', ?)`,
      [req.user.id, restaurant_id, totalCost, code]
    )
    const orderId = orderResult.insertId

    for (const item of items) {
      await conn.query(
        `INSERT INTO drink_order_items (drink_order_id, drink_id, quantity, price_points) VALUES (?, ?, ?, ?)`,
        [orderId, item.drink_id, item.quantity, priceMap[item.drink_id]]
      )
    }

    await conn.commit()

    const [[restaurant]] = await db.query('SELECT name FROM users WHERE id = ?', [restaurant_id])
    res.status(201).json({ order_id: orderId, code, total_cost: totalCost, status: 'pending', restaurant_name: restaurant?.name })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

// POST /api/drinks/order/:orderId/pickup
router.post('/order/:orderId/pickup', auth, async (req, res) => {
  const { code } = req.body
  const { orderId } = req.params

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [[order]] = await conn.query(
      'SELECT * FROM drink_orders WHERE id = ? FOR UPDATE',
      [orderId]
    )
    if (!order) {
      await conn.rollback()
      return res.status(404).json({ message: 'Užsakymas nerastas' })
    }
    if (order.orderer_id !== req.user.id) {
      await conn.rollback()
      return res.status(403).json({ message: 'Prieiga uždrausta' })
    }
    if (order.status !== 'pending') {
      await conn.rollback()
      return res.status(400).json({ message: 'Užsakymas jau įvykdytas arba atšauktas' })
    }
    if (order.pickup_code.toLowerCase() !== String(code).toLowerCase()) {
      await conn.rollback()
      return res.status(400).json({ message: 'Netinkamas kodas' })
    }

    const [[user]] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [order.orderer_id])
    if ((user?.points_balance ?? 0) < order.total_cost) {
      await conn.rollback()
      return res.status(400).json({ message: 'Nepakanka taškų' })
    }

    await conn.query('UPDATE users SET points_balance = points_balance - ? WHERE id = ?', [order.total_cost, order.orderer_id])
    await conn.query(
      "INSERT INTO points_transactions (user_id, amount, type) VALUES (?, ?, 'gerimas_pirkimas')",
      [order.orderer_id, -order.total_cost]
    )
    await conn.query("UPDATE drink_orders SET status = 'picked_up', points_deducted = TRUE WHERE id = ?", [orderId])

    await conn.commit()

    const [[updated]] = await db.query('SELECT points_balance FROM users WHERE id = ?', [order.orderer_id])
    res.json({ success: true, new_balance: updated?.points_balance ?? 0, order_id: Number(orderId) })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  } finally {
    conn.release()
  }
})

// GET /api/drinks/orders/incoming  (tik restoranui)
router.get('/orders/incoming', auth, async (req, res) => {
  if (req.user.role !== 'restoranas') {
    return res.status(403).json({ message: 'Prieiga uždrausta' })
  }
  try {
    const [orders] = await db.query(
      `SELECT do.id AS order_id, do.pickup_code, do.total_cost, do.status, do.created_at,
              u.name AS orderer_name, u.phone AS orderer_phone
       FROM drink_orders do JOIN users u ON u.id = do.orderer_id
       WHERE do.restaurant_id = ? AND do.status = 'pending'
       ORDER BY do.created_at DESC`,
      [req.user.id]
    )

    const orderIds = orders.map((o) => o.order_id)
    let itemsByOrder = {}
    if (orderIds.length > 0) {
      const [items] = await db.query(
        `SELECT doi.drink_order_id, d.name, doi.quantity, doi.price_points
         FROM drink_order_items doi JOIN drinks d ON d.id = doi.drink_id
         WHERE doi.drink_order_id IN (?)`,
        [orderIds]
      )
      for (const item of items) {
        if (!itemsByOrder[item.drink_order_id]) itemsByOrder[item.drink_order_id] = []
        itemsByOrder[item.drink_order_id].push({ name: item.name, quantity: item.quantity, price_points: item.price_points })
      }
    }

    const result = orders.map((o) => ({ ...o, items: itemsByOrder[o.order_id] ?? [] }))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
})

module.exports = router
