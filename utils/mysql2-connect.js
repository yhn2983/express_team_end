import mysql from 'mysql2/promise.js'
import 'dotenv/config.js'

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
})

console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})

db.getConnection()
  .then((connection) => {
    console.log('Database Connected Successfully'.bgGreen)
    connection.release()
  })
  .catch((error) => {
    console.log('Database Connection Fail'.bgRed)
    console.log(error)
  })

export default db
