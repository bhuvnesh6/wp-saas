const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({

    instanceName: {
        type: String,
        unique: true
    },

    apiKey: {
        type: String
    },

    webhookUrl: {
        type: String
    },

    sessionPath: {
        type: String
    },

    status: {
        type: String,
        default: "offline"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Client", ClientSchema);