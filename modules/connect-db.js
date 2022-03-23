const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sake',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
})

module.exports = pool.promise()