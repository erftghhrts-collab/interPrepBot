import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const dbName = process.env.MONGODB_DB || "ai_mock_interviews";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (uri && process.env.NODE_ENV === "development") {
  if (!global.__mongoClientPromise) {
    const client = new MongoClient(uri);
    global.__mongoClientPromise = client.connect().catch((error) => {
      console.error("MongoDB connection failed:", error);
      throw error;
    });
  }
  clientPromise = global.__mongoClientPromise;
} else if (uri) {
  const client = new MongoClient(uri);
  clientPromise = client.connect().catch((error) => {
    console.error("MongoDB connection failed:", error);
    throw error;
  });
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    console.error("Missing environment variable: MONGODB_URI");
    throw new Error("Missing environment variable: MONGODB_URI");
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
