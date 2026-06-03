const axios = require("axios");

async function sendToWebhook(webhookUrl, data) {

    try {

        const response = await axios.post(
            webhookUrl,
            data
        );

        return response.data;

    } catch (err) {

        console.log("Webhook Error:", err.message);

        return null;
    }
}

module.exports = {
    sendToWebhook
};