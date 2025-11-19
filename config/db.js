import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv'; // load MONGO_URI from .env
dotenv.config(); // load .env file

const uri = process.env.MONGO_URI; // e.g. "mongodb+srv://user:pass@cluster.mongodb.net/?..."
console.log("🔑 MongoDB URI:", uri);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // stop the server if DB fails
  }
}

export { connectDB, client }