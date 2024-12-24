require('dotenv').config()
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.SQL_HOST,
    user: 'root',
    password: '',
    database: 'sake',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
})

module.exports = pool.promise()