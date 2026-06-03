const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
//const puppeteer = require("puppeteer");

const clients = {};
const qrStore = {};

async function startClient(instanceName) {

    if (clients[instanceName]) {
        return clients[instanceName];
    }


    
    //const chromePath = await puppeteer.executablePath();

    console.log(`Starting instance: ${instanceName}`);
    //console.log(`Using browser: ${chromePath}`);

    const client = new Client({

        authStrategy: new LocalAuth({
            clientId: instanceName
        }),

        puppeteer: {
            executablePath: process.env.CHROME_PATH || "/snap/bin/chromium",
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

            qrStore[instanceName] =
                await qrcode.toDataURL(qr);

            console.log(
                `QR Generated -> ${instanceName}`
            );

        } catch (err) {

            console.error(
                `QR generation failed for ${instanceName}:`,
                err
            );
        }
    });

    client.on("ready", () => {

        console.log(
            `${instanceName} Ready`
        );

        qrStore[instanceName] = null;
    });

    client.on("authenticated", () => {

        console.log(
            `${instanceName} Authenticated`
        );
    });

    client.on("auth_failure", (msg) => {

        console.log(
            `${instanceName} Auth Failure:`,
            msg
        );
    });

    client.on("disconnected", (reason) => {

        console.log(
            `${instanceName} Disconnected:`,
            reason
        );

        delete clients[instanceName];
    });

    try {

        client.on("loading_screen", (percent, message) => {
    console.log(percent, message);
});

client.on("change_state", state => {
    console.log("STATE:", state);
});

client.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

client.on("ready", () => {
    console.log("READY");
});

        await client.initialize();

        clients[instanceName] = client;

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

async function stopClient(instanceName) {

    if (!clients[instanceName]) {
        return;
    }

    try {

        await clients[instanceName].destroy();

    } catch (err) {

        console.error(
            `Failed stopping ${instanceName}:`,
            err
        );
    }

    delete clients[instanceName];
    delete qrStore[instanceName];
}

module.exports = {
    startClient,
    getQR,
    stopClient
};