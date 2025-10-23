// frontend/lib/mongodb.js
import { MongoClient, ServerApiVersion } from "mongodb";

const rawUri = process.env.MONGODB_URI;

// Atlas sometimes appends loadBalanced=true, which breaks replica set URIs; strip it.
const sanitizeMongoUri = (input) => {
  if (!input) return input;
  try {
    const url = new URL(input);
    if (url.searchParams.get("loadBalanced") === "true") {
      url.searchParams.delete("loadBalanced");
      return url.toString();
    }
    return input;
  } catch {
    return input.replace(/([?&])loadBalanced=true&?/i, (match, sep) => {
      if (sep === "?" && match.endsWith("&")) return "?";
      if (sep === "?" || match.endsWith("&")) return sep;
      return "";
    });
  }
};

const uri = sanitizeMongoUri(rawUri);
if (uri && uri !== rawUri) {
  process.env.MONGODB_URI = uri;
}
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const globalAny = global;

if (process.env.NODE_ENV === "development") {
  if (
    !globalAny._mongoClientPromise ||
    globalAny._mongoClientUri !== process.env.MONGODB_URI
  ) {
    client = new MongoClient(process.env.MONGODB_URI, options);
    globalAny._mongoClientPromise = client.connect();
    globalAny._mongoClientUri = process.env.MONGODB_URI;
  }
  clientPromise = globalAny._mongoClientPromise;
} else {
  client = new MongoClient(process.env.MONGODB_URI, options);
  clientPromise = client.connect();
}

export default clientPromise;
