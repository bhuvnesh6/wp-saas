const express = require("express");

const router = express.Router();

const {
    getClient
} = require("../services/whatsapp");

router.post(
    "/send-message",
    async (req, res) => {

        try {

            const {
                instanceName,
                number,
                message
            } = req.body;

            const client =
                getClient(instanceName);

            if (!client) {

                return res.json({
                    error:
                        "WhatsApp not connected"
                });
            }

            const formattedNumber =
                number.replace(/\D/g, "") +
                "@c.us";

            await client.sendMessage(
                formattedNumber,
                message
            );

            res.json({
                success: true
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });
        }
    }
);

module.exports = router;