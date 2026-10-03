import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: Promise<MongoClient> | undefined;
}

function client(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  // Reuse one connection across hot reloads / serverless invocations.
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect();
  }
  return global._mongoClient;
}

export async function db(): Promise<Db> {
  return (await client()).db(process.env.MONGODB_DB || "untitled_project");
}

let indexed = false;
export async function collections() {
  const d = await db();
  const waitlist = d.collection("waitlist");
  const surveys = d.collection("surveys");
  const admins = d.collection("admins");
  if (!indexed) {
    await Promise.all([
      waitlist.createIndex({ email: 1 }, { unique: true }),
      waitlist.createIndex({ createdAt: -1 }),
      surveys.createIndex({ createdAt: -1 }),
      admins.createIndex({ email: 1 }, { unique: true }),
    ]);
    indexed = true;
  }
  return { waitlist, surveys, admins };
}
