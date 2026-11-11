
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const db = require("./db");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin session
app.use(session({
    name: "lakhan.admin.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // Local development only
        maxAge: 1000 * 60 * 60
    }
}));

// Serve portfolio and admin files
app.use(express.static(path.join(__dirname, "..")));

function requireAdmin(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    next();
}

// Existing contact form API
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof message !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !message.trim() ||
            name.length > 100 ||
            email.length > 150 ||
            message.length > 5000 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid details."
            });
        }

        await db.execute(
            `INSERT INTO contacts (name, email, message)
             VALUES (?, ?, ?)`,
            [name.trim(), email.trim(), message.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Message saved successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to save message."
        });
    }
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter username and password."
            });
        }

        const [rows] = await db.execute(
            "SELECT id, username, password_hash FROM admin_users WHERE username = ?",
            [username.trim()]
        );

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const admin = rows[0];

        const validPassword = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        await new Promise((resolve, reject) => {
            req.session.regenerate(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.admin = {
            id: admin.id,
            username: admin.username
        };

        res.json({
            success: true,
            message: "Login successful!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// Check logged-in admin
app.get("/api/admin/me", requireAdmin, (req, res) => {
    res.json({
        success: true,
        admin: req.session.admin
    });
});

// Logout
app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });
        }

        res.clearCookie("lakhan.admin.sid");

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// Dashboard statistics
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(DATE(created_at) = CURDATE()) AS today
            FROM contacts
        `);

        res.json({
            success: true,
            stats: {
                total: Number(rows[0].total || 0),
                today: Number(rows[0].today || 0)
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load statistics."
        });
    }
});

// Get and search contact messages
app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
        const search = String(req.query.search || "").trim();

        const [messages] = await db.execute(
            `SELECT id, name, email, message, created_at
             FROM contacts
             WHERE name LIKE ? OR email LIKE ?
             ORDER BY created_at DESC
             LIMIT 200`,
            [`%${search}%`, `%${search}%`]
        );

        res.json({
            success: true,
            messages
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load messages."
        });
    }
});

// Delete a message
app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID."
            });
        }

        const [result] = await db.execute(
            "DELETE FROM contacts WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        res.json({
            success: true,
            message: "Message deleted successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete message."
        });
    }
});

// Admin shortcut
app.get("/admin", (req, res) => {
    res.redirect("/admin/login.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Portfolio running at http://localhost:${PORT}`);
});
