const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const sessionStatus = {};
const clients = {};
const qrStore = {};

async function sendToWebhook(url, payload) {

    if (!url) {
        console.log("No webhook URL configured");
        return null;
    }

    try {

        console.log("Sending webhook to:", url);
        console.log(payload);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();

        console.log("Webhook response:", text);

        try {
            return JSON.parse(text);
        } catch {
            return null;
        }

    } catch (err) {

        console.error(
            "Webhook Error:",
            err.message
        );

        return null;
    }
}

async function startClient(instanceName) {

    if (clients[instanceName]) {
        return clients[instanceName];
    }

    const ClientModel =
        require("../models/Client");

    const dbClient =
        await ClientModel.findOne({
            instanceName
        });

    if (!dbClient) {
        throw new Error(
            "Instance not found in database"
        );
    }

    console.log(
        `Starting instance: ${instanceName}`
    );

    console.log(
        "Chrome:",
        process.env.CHROME_PATH || "/usr/bin/chromium"
    );

    const client = new Client({

        authStrategy: new LocalAuth({
            clientId: instanceName
        }),

        puppeteer: {

            executablePath:
                process.env.CHROME_PATH ||
                "/usr/bin/chromium",

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        }
    });

    client.on("qr", async (qr) => {

        try {

            sessionStatus[instanceName] =
                "WAITING_QR";

            qrStore[instanceName] =
                await qrcode.toDataURL(qr);

            console.log(
                `QR Generated -> ${instanceName}`
            );

        } catch (err) {

            console.error(err);
        }
    });

    client.on("authenticated", () => {

        sessionStatus[instanceName] =
            "AUTHENTICATED";

        console.log(
            `${instanceName} Authenticated`
        );
    });

    client.on("ready", () => {

        sessionStatus[instanceName] =
            "READY";

        qrStore[instanceName] = null;

        console.log(
            `${instanceName} Ready`
        );
    });

    client.on("loading_screen", (percent, msg) => {

        console.log(
            "Loading:",
            percent,
            msg
        );
    });

    client.on("change_state", (state) => {

        console.log(
            "STATE:",
            state
        );
    });

    client.on("auth_failure", (msg) => {

        sessionStatus[instanceName] =
            "AUTH_FAILED";

        console.log(
            "AUTH FAILURE:",
            msg
        );
    });

    client.on("disconnected", (reason) => {

        sessionStatus[instanceName] =
            "DISCONNECTED";

        console.log(
            `${instanceName} disconnected:`,
            reason
        );

        delete clients[instanceName];
    });

    // INCOMING MESSAGE LISTENER

    client.on("message", async (message) => {

        try {

            console.log(
                "MESSAGE RECEIVED:",
                message.body
            );

            if (message.fromMe) {
                return;
            }

            if (
                message.from.includes("@g.us")
            ) {
                return;
            }

            const payload = {

                instanceName,

                from: message.from,

                body: message.body,

                pushName:
                    message._data?.notifyName ||
                    "",

                timestamp:
                    Date.now()
            };

            const webhookResponse =
                await sendToWebhook(
                    dbClient.webhookUrl,
                    payload
                );

            if (
                webhookResponse &&
                webhookResponse.reply
            ) {

                await client.sendMessage(
                    message.from,
                    webhookResponse.reply
                );

                console.log(
                    "Auto reply sent"
                );
            }

        } catch (err) {

            console.error(
                "Message Handler Error:",
                err
            );
        }
    });

    // BACKUP EVENT

    client.on(
        "message_create",
        async (message) => {

            if (message.fromMe) {
                return;
            }

            console.log(
                "MESSAGE_CREATE:",
                message.body
            );
        }
    );

    try {

        await client.initialize();

        clients[instanceName] =
            client;

        return client;

    } catch (err) {

        console.error(
            `Failed to initialize ${instanceName}:`,
            err
        );

        delete clients[instanceName];

        throw err;
    }
}

function getQR(instanceName) {

    return qrStore[instanceName] || null;
}

function getStatus(instanceName) {

    return (
        sessionStatus[instanceName] ||
        "OFFLINE"
    );
}

function getClient(instanceName) {

    return clients[instanceName];
}

async function stopClient(instanceName) {

    if (!clients[instanceName]) {
        return;
    }

    try {

        await clients[
            instanceName
        ].destroy();

    } catch (err) {

        console.error(err);
    }

    delete clients[instanceName];
    delete qrStore[instanceName];
    delete sessionStatus[instanceName];
}

module.exports = {
    startClient,
    getQR,
    getStatus,
    stopClient,
    getClient
};