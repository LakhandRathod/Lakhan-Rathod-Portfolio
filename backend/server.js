
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const db = require("./db");
const app = express();

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

const frontendUrl =
    process.env.FRONTEND_URL ||
    "https://lakhan-rathod-portfolio.netlify.app";

// Required when deployed behind Render's proxy
app.set("trust proxy", 1);

// CORS configuration
app.use(cors({
    origin: [
        frontendUrl,
        "http://localhost:5500",
        "http://localhost:3000"
    ],
    credentials: true
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Persistent MySQL/TiDB session store
const sessionStore = new MySQLStore({}, db);

// Admin session configuration
app.use(session({
    name: "lakhan.admin.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 1000 * 60 * 60
    }
}));

// Admin authentication middleware
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.admin) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    next();
}

// ==========================================
// CONTACT FORM API
// ==========================================

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body || {};

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
        console.error("Contact API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to save message."
        });
    }
});

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter username and password."
            });
        }

        const [rows] = await db.execute(
            `SELECT id, username, password_hash
             FROM admin_users
             WHERE username = ?`,
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

        req.session.regenerate(error => {
            if (error) {
                console.error("Session regenerate error:", error.message);

                return res.status(500).json({
                    success: false,
                    message: "Login failed."
                });
            }

            req.session.admin = {
                id: admin.id,
                username: admin.username
            };

            req.session.save(saveError => {
                if (saveError) {
                    console.error("Session save error:", saveError.message);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to create login session."
                    });
                }

                res.json({
                    success: true,
                    message: "Login successful!"
                });
            });
        });

    } catch (error) {
        console.error("Admin login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// ==========================================
// CHECK LOGGED-IN ADMIN
// ==========================================

app.get("/api/admin/me", requireAdmin, (req, res) => {
    res.json({
        success: true,
        admin: req.session.admin
    });
});

// ==========================================
// ADMIN LOGOUT
// ==========================================

app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });
        }

        res.clearCookie("lakhan.admin.sid", {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction
        });

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(
                    SUM(DATE(created_at) = CURDATE()),
                    0
                ) AS today
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
        console.error("Stats API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load statistics."
        });
    }
});

// ==========================================
// GET AND SEARCH CONTACT MESSAGES
// ==========================================

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
        console.error("Messages API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load messages."
        });
    }
});

// ==========================================
// DELETE CONTACT MESSAGE
// ==========================================

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
        console.error("Delete API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to delete message."
        });
    }
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "API is running."
    });
});

// Unknown API route
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// ==========================================
// START SERVER AFTER SESSION STORE IS READY
// ==========================================

sessionStore.onReady()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Portfolio API running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("Session store startup failed:", error);
        process.exit(1);
    });
