const mongoose = require("mongoose");

async function connectDB() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI,
            {
                dbName: process.env.DB_NAME
            }
        );

        console.log("MongoDB Connected");

    } catch (err) {

        console.log(err);

        process.exit(1);
    }
}

module.exports = connectDB;