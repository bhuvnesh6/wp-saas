const {
    Client,
    LocalAuth
} = require("whatsapp-web.js");

const QRCode = require("qrcode");

const {
    sendToWebhook
} = require("./webhook");

const clientStore = {};
const qrStore = {};

async function initClient(clientData) {

    if (clientStore[clientData.instanceName]) {
        return;
    }

    console.log("Starting:", clientData.instanceName);

    const client = new Client({

        authStrategy: new LocalAuth({
            clientId: clientData.instanceName,
            dataPath: clientData.sessionPath
        }),

        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        }
    });

    clientStore[clientData.instanceName] = client;

    client.on("qr", async (qr) => {

        console.log("QR Generated");

        qrStore[clientData.instanceName] =
            await QRCode.toDataURL(qr);
    });

    client.on("ready", () => {

        console.log(
            clientData.instanceName,
            "READY"
        );

        qrStore[clientData.instanceName] = null;
    });

    client.on("message", async (message) => {

        if (message.fromMe) return;

        if (message.from.includes("@g.us")) return;

        const payload = {

            instanceName: clientData.instanceName,

            from: message.from,

            message: message.body,

            timestamp: Date.now()
        };

        try {

            const response =
                await sendToWebhook(
                    clientData.webhookUrl,
                    payload
                );

            if (!response) return;

            if (response.reply) {

                await client.sendMessage(
                    message.from,
                    response.reply
                );
            }

        } catch (err) {

            console.log(err.message);
        }
    });

    await client.initialize();
}

function getClient(instanceName) {

    return clientStore[instanceName];
}

function getQR(instanceName) {

    return qrStore[instanceName];
}

module.exports = {
    initClient,
    getClient,
    getQR
};