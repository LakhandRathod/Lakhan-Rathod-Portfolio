
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const caPath =
    process.env.DB_SSL_CA_PATH ||
    path.join(__dirname, "certs", "ca.pem");

if (!fs.existsSync(caPath)) {
    throw new Error(`TiDB CA certificate not found: ${caPath}`);
}

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;
