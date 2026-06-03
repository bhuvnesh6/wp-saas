// routes/admin.routes.js
// ALL routes protected by authMiddleware (checks x-api-key vs MASTER_KEY in .env)
const whatsappManager =
require("../services/whatsappManager");

const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");

// ─── KEY VERIFICATION ENDPOINT ─────────────────────────────────────────────
// Used by the login page to validate the key before storing it in localStorage
// The auth middleware itself does the actual check — if it passes, 200 is returned.
router.post("/verify-key", auth, (req, res) => {
    res.json({ ok: true });
});

// ─── ALL OTHER ROUTES ALSO REQUIRE AUTH ────────────────────────────────────
router.use(auth);

// GET all clients
router.get("/clients", async (req, res) => {
    try {
        // Replace this with your actual DB query, e.g.:
        // const clients = await Client.find({});
        const Client = require("../models/Client"); // adjust path as needed
        const clients = await Client.find({});
        res.json(clients);
    } catch (err) {
        console.error("GET /clients error:", err);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});

// POST add client
router.post("/add-client", async (req, res) => {
    try {
        const { instanceName, webhookUrl } = req.body;

        if (!instanceName) {
            return res.status(400).json({ error: "instanceName is required" });
        }

        const Client = require("../models/Client");
        const exists = await Client.findOne({ instanceName });

        if (exists) {
            return res.status(409).json({ error: "Instance already exists" });
        }

        const client = new Client({ instanceName, webhookUrl });
        await client.save();

        res.status(201).json(client);
    } catch (err) {
        console.error("POST /add-client error:", err);
        res.status(500).json({ error: "Failed to add client" });
    }
});

// GET start client
router.get("/start/:name", async (req, res) => {
    try {
        console.log("Starting instance:", req.params.name);

        await whatsappManager.startClient(req.params.name);

        console.log("Started successfully");

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// GET QR code for instance
router.get("/qr/:name", async (req, res) => {

    try {

        const qr =
            whatsappManager.getQR(
                req.params.name
            );

        if (!qr) {

            return res.send(`
                <p style="
                color:#00e676;
                font-family:monospace;">
                Waiting for QR...
                </p>
            `);
        }

        res.send(`
            <img
                src="${qr}"
                width="250"
            />
        `);

    } catch (err) {

        res.status(500).send(
            "Failed"
        );
    }
});

// PUT update webhook
router.put("/update-webhook/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const { webhookUrl } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({ error: "webhookUrl is required" });
        }

        const Client = require("../models/Client");
        const client = await Client.findOneAndUpdate(
            { instanceName: name },
            { webhookUrl },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({ error: "Instance not found" });
        }

        res.json(client);
    } catch (err) {
        console.error("PUT /update-webhook error:", err);
        res.status(500).json({ error: "Failed to update webhook" });
    }
});

// DELETE remove client
router.delete("/delete-client/:name", async (req, res) => {
    try {
        const { name } = req.params;

        const Client = require("../models/Client");
        const result = await Client.findOneAndDelete({ instanceName: name });

        if (!result) {
            return res.status(404).json({ error: "Instance not found" });
        }

        // TODO: also stop the WhatsApp session if running
        // e.g. whatsappManager.stop(name);
        await whatsappManager.stopClient(
    name
);
        res.json({ ok: true });
    } catch (err) {
        console.error("DELETE /delete-client error:", err);
        res.status(500).json({ error: "Failed to delete client" });
    }
});

module.exports = router;