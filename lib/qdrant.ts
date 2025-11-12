// lib/qdrant.ts
// @ts-nocheck
import { QdrantClient } from "@qdrant/js-client-rest";

let client: QdrantClient | null = null;

export function getQdrantClient() {
  if (client) return client;

  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url) {
    throw new Error("QDRANT_URL is not set");
  }

  client = new QdrantClient({
    url,
    apiKey,
  });

  return client;
}
