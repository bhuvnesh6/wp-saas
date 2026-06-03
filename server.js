const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");

const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin.routes");
const messageRoutes = require("./routes/message.routes");

const app = express();

connectDB();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── KEY VERIFICATION ──────────────────────────────────────────────────────
// Login page POSTs here — compares x-api-key header against MASTER_KEY in .env
app.post("/verify-key", (req, res) => {
    const key = req.headers["x-api-key"];
    console.log("verify-key called, key received:", key ? "YES" : "NO");
    console.log("MASTER_KEY loaded:", process.env.MASTER_KEY ? "YES" : "NO");

    if (!key || !process.env.MASTER_KEY) {
        return res.status(500).json({ error: "Server misconfiguration" });
    }

    if (key === process.env.MASTER_KEY) {
        console.log("Key matched — access granted");
        return res.json({ ok: true });
    }

    console.log("Key mismatch — access denied");
    return res.status(401).json({ error: "Invalid key" });
});

// ─── PAGES ─────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

// ─── STATIC ────────────────────────────────────────────────────────────────
app.use("/public", express.static("public"));

// ─── API ROUTES ────────────────────────────────────────────────────────────
app.use("/admin", adminRoutes);
app.use("/api", messageRoutes);

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
    console.log("MASTER_KEY loaded:", process.env.MASTER_KEY ? "YES ✓" : "NO — check .env!");
});