[1mdiff --git a/backend/db.js b/backend/db.js[m
[1mindex 776f683..4634988 100644[m
[1m--- a/backend/db.js[m
[1m+++ b/backend/db.js[m
[36m@@ -1,17 +1,29 @@[m
[32m+[m
 const mysql = require("mysql2/promise");[m
[31m-// require("dotenv").config();[m
[32m+[m[32mconst fs = require("fs");[m
[32m+[m[32mconst path = require("path");[m
[32m+[m
 require("dotenv").config({[m
[31m-    path: require("path").join(__dirname, ".env")[m
[32m+[m[32m  path: path.join(__dirname, ".env")[m
 });[m
 [m
 const db = mysql.createPool({[m
[31m-    host: process.env.DB_HOST,[m
[31m-    user: process.env.DB_USER,[m
[31m-    password: process.env.DB_PASSWORD,[m
[31m-    database: process.env.DB_NAME,[m
[31m-    port: 3306,[m
[31m-    waitForConnections: true,[m
[31m-    connectionLimit: 10[m
[32m+[m[32m  host: process.env.DB_HOST,[m
[32m+[m[32m  port: Number(process.env.DB_PORT || 4000),[m
[32m+[m[32m  user: process.env.DB_USER,[m
[32m+[m[32m  password: process.env.DB_PASSWORD,[m
[32m+[m[32m  database: process.env.DB_NAME,[m
[32m+[m
[32m+[m[32m  ssl: {[m
[32m+[m[32m    ca: fs.readFileSync([m
[32m+[m[32m      path.join(__dirname, "certs", "ca.pem")[m
[32m+[m[32m    ),[m
[32m+[m[32m    rejectUnauthorized: true[m
[32m+[m[32m  },[m
[32m+[m
[32m+[m[32m  waitForConnections: true,[m
[32m+[m[32m  connectionLimit: 10,[m
[32m+[m[32m  queueLimit: 0[m
 });[m
 [m
[31m-module.exports = db;[m
\ No newline at end of file[m
[32m+[m[32mmodule.exports = db;[m
