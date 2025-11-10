import mysql from 'mysql2/promise'

export const db = await mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'highlevel_calendar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
