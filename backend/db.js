const mysql = require('mysql2/promise')
require('dotenv').config()

// DB_HOST gali būti "host:portas" arba tik "host"
const [dbHost, dbPort] = (process.env.DB_HOST ?? '127.0.0.1').split(':')

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort ? Number(dbPort) : (process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'maistoapp',
  waitForConnections: true,
  connectionLimit: 10,
})

module.exports = pool
