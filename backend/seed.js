require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./db')

const users = [
  { name: 'Davėjas Jonas',       email: 'davejas@test.com',          password: 'test123', role: 'davejas' },
  { name: 'Gavėjas Petras',      email: 'gavejas@test.com',          password: 'test123', role: 'gavejas' },
  { name: 'Vežėjas Tomas',       email: 'transportuotojas@test.com', password: 'test123', role: 'transportuotojas' },
  { name: 'Restoranas Vilniaus', email: 'restoranas@test.com',       password: 'test123', role: 'restoranas' },
]

const ts = (hoursFromNow) =>
  new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ')

async function seed() {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // Išvalyti senus duomenis
    await conn.query('SET FOREIGN_KEY_CHECKS = 0')
    await conn.query('TRUNCATE TABLE points_transactions')
    await conn.query('TRUNCATE TABLE feedback')
    await conn.query('TRUNCATE TABLE orders')
    await conn.query('TRUNCATE TABLE offers')
    await conn.query('TRUNCATE TABLE users')
    await conn.query('SET FOREIGN_KEY_CHECKS = 1')

    // Vartotojai
    console.log('Kuriami vartotojai...')
    const ids = {}
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10)
      const [r] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, hash, u.role]
      )
      ids[u.role] = r.insertId
      console.log(`  ✓ ${u.role.padEnd(18)} ${u.email} / ${u.password}`)
    }

    // Pasiūlymai (6 vnt.)
    console.log('\nKuriami pasiūlymai...')
    const offerData = [
      { user_id: ids.davejas,    title: 'Naminis obuolių pyragas',      quantity: 4, expires_at: ts(24),  status: 'aktyvus',    lat: 54.6872, lng: 25.2797 },
      { user_id: ids.davejas,    title: 'Daržovių sriuba (3 porcijos)', quantity: 3, expires_at: ts(12),  status: 'rezervuotas',lat: 54.6901, lng: 25.2750 },
      { user_id: ids.davejas,    title: 'Juoda duona su sviestu',       quantity: 2, expires_at: ts(6),   status: 'rezervuotas',lat: 54.6855, lng: 25.2810 },
      { user_id: ids.restoranas, title: 'Cepelinai su grietine',        quantity: 6, expires_at: ts(48),  status: 'aktyvus',    lat: 54.6850, lng: 25.2820 },
      { user_id: ids.restoranas, title: 'Šaltibarščiai su bulvėmis',    quantity: 5, expires_at: ts(48),  status: 'rezervuotas',lat: 54.6920, lng: 25.2680 },
      { user_id: ids.restoranas, title: 'Kibinai (10 vnt.)',            quantity: 10, expires_at: ts(8),  status: 'rezervuotas',lat: 54.6835, lng: 25.2760 },
    ]
    const offerIds = []
    for (const o of offerData) {
      const [r] = await conn.query(
        'INSERT INTO offers (user_id, title, quantity, expires_at, status, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [o.user_id, o.title, o.quantity, o.expires_at, o.status, o.lat, o.lng]
      )
      offerIds.push(r.insertId)
      console.log(`  ✓ "${o.title}" [${o.status}]`)
    }

    // Užsakymai — visų statusų pavyzdžiai
    console.log('\nKuriami užsakymai...')
    const orderData = [
      // gavejas užsakė → laukiama davejas patvirtinimo
      { offer_id: offerIds[1], gavejas_id: ids.gavejas, transportuotojas_id: null,             status: 'laukiama' },
      // davejas patvirtino → laukia transportuotojo
      { offer_id: offerIds[2], gavejas_id: ids.gavejas, transportuotojas_id: null,             status: 'patvirtinta' },
      // transportuotojas paėmė → veža
      { offer_id: offerIds[4], gavejas_id: ids.gavejas, transportuotojas_id: ids.transportuotojas, status: 'pristatoma' },
      // įvykdyta
      { offer_id: offerIds[5], gavejas_id: ids.gavejas, transportuotojas_id: ids.transportuotojas, status: 'ivykdyta' },
    ]
    const orderIds = []
    for (const o of orderData) {
      const [r] = await conn.query(
        'INSERT INTO orders (offer_id, gavejas_id, transportuotojas_id, status) VALUES (?, ?, ?, ?)',
        [o.offer_id, o.gavejas_id, o.transportuotojas_id, o.status]
      )
      orderIds.push(r.insertId)
      console.log(`  ✓ Užsakymas #${r.insertId} [${o.status}]`)
    }

    // Taškai už įvykdytą užsakymą
    const completedOrderId = orderIds[3]
    await conn.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 10, 'uzsakymas')",
      [ids.davejas, completedOrderId]
    )
    await conn.query('UPDATE users SET points_balance = 10 WHERE id = ?', [ids.davejas])
    await conn.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 5, 'uzsakymas')",
      [ids.gavejas, completedOrderId]
    )
    await conn.query('UPDATE users SET points_balance = 5 WHERE id = ?', [ids.gavejas])
    await conn.query(
      "INSERT INTO points_transactions (user_id, order_id, amount, type) VALUES (?, ?, 8, 'pristatymas')",
      [ids.transportuotojas, completedOrderId]
    )
    await conn.query('UPDATE users SET points_balance = 8 WHERE id = ?', [ids.transportuotojas])

    // Atsiliepimas už įvykdytą užsakymą
    await conn.query(
      "INSERT INTO feedback (order_id, from_user_id, to_user_id, target_type, rating, comment) VALUES (?, ?, ?, 'davejas', 'heart', 'Labai skanus maistas!')",
      [completedOrderId, ids.gavejas, ids.davejas]
    )
    console.log('\n  ✓ Taškai ir atsiliepimas sukurti')

    await conn.commit()
    console.log('\n✅ Viskas sukurta!\n')
    console.log('Rolė             El. paštas                        Slaptažodis  Taškai')
    console.log('─'.repeat(72))
    console.log(`davejas          davejas@test.com                  test123      10`)
    console.log(`gavejas          gavejas@test.com                  test123      5`)
    console.log(`transportuotojas transportuotojas@test.com         test123      8`)
    console.log(`restoranas       restoranas@test.com               test123      0`)
    process.exit(0)
  } catch (err) {
    await conn.rollback()
    console.error('Klaida:', err.message)
    process.exit(1)
  } finally {
    conn.release()
  }
}

seed()
