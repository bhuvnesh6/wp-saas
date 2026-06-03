const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const sessionStatus = {};
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
            executablePath: process.env.CHROME_PATH || "/usr/bin/chromium",
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

            sessionStatus[instanceName] = "WAITING_QR";

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

        sessionStatus[instanceName] = "READY";

        console.log(
            `${instanceName} Ready`
        );

        qrStore[instanceName] = null;
    });

    client.on("authenticated", () => {

        sessionStatus[instanceName] = "AUTHENTICATED";

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
        sessionStatus[instanceName] = "DISCONNECTED";
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


function getClient(instanceName) {

    return clients[instanceName];
}



function getStatus(instanceName) {
    return sessionStatus[instanceName] || "OFFLINE";
}

module.exports = {
    startClient,
    getQR,
    stopClient,
    getStatus,
    getClient
};