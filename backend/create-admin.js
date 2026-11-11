
require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const bcrypt = require("bcryptjs");
const db = require("./db");

async function createAdmin() {
    try {
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;

        if (!username || !password || password.length < 12) {
            throw new Error(
                "Set ADMIN_USERNAME and a password of at least 12 characters in .env"
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO admin_users (username, password_hash)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            [username, passwordHash]
        );

        console.log("Admin account created/updated successfully.");
        console.log("Username:", username);

    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

createAdmin();
