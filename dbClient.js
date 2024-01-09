const { MongoClient } = require('mongodb');

const uri = "127.0.0.1"; // MongoDB URI
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
  } catch (e) {
    console.error("Could not connect to MongoDB", e);
    process.exit(1);
  }
}

module.exports = connectDB;

