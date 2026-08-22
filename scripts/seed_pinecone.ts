import { readFileSync } from "node:fs";
import path from "node:path";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@huggingface/transformers";

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY in .env");
  }

  const jsonPath = path.join(process.cwd(), "scripts", "1.json");
  console.log(`Reading parsed verses from ${jsonPath}...`);
  
  const rawData = readFileSync(jsonPath, "utf-8");
  const extractedItems = JSON.parse(rawData);

  console.log(`Loaded ${extractedItems.length} verses. Preparing to embed...`);

  // 1. Initialize Local Transformers.js Pipeline
  // This automatically downloads Xenova/bge-base-en-v1.5 (a 768-dimension model) on the first run
  console.log("Initializing local model (BAAI/bge-base-en-v1.5)...");
  const extractor = await pipeline("feature-extraction", "Xenova/bge-base-en-v1.5");

  // 2. Initialize Native Pinecone Client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  
  // Important: Ensure the 'dhammapada' index in Pinecone is created with 
  // Dimension = 768 and Metric = dotproduct
  const index = pinecone.Index("dhammapada"); 

  console.log("Uploading vectors to Pinecone in batches...");

  // 3. Process and upload in batches
  // You no longer have rate limits, but batching keeps memory usage low
  const batchSize = 50;
  for (let i = 0; i < extractedItems.length; i += batchSize) {
    const batch = extractedItems.slice(i, i + batchSize);
    const texts = batch.map((item: any) => item.pageContent);
    
    console.log(`Embedding verses ${i + 1} to ${Math.min(i + batchSize, extractedItems.length)}...`);
    
    // Generate embeddings locally. We use 'mean' pooling and normalize for cosine similarity.
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    
    // Convert the Tensor output to a standard 2D JavaScript array
    const vectorArrays = output.tolist();

    // Format the payload exactly how Pinecone expects it
    const pineconeVectors = batch.map((item: any, idx: number) => {
      const vector = vectorArrays[idx];
      
      // Creating a unique ID that prevents overwriting if verseNumber is missing or duplicated.
      // We fall back to a global index if verseNumber is not present.
      const verseNum = item.metadata?.verseNumber || (i + idx + 1);
      
      return {
        id: `verse-${verseNum}`,
        values: vector,
        metadata: {
          pageContent: item.pageContent, 
          ...item.metadata
        }
      };
    });

    // Upsert the batch into the database
    await index.upsert(pineconeVectors);
  }

  console.log("✅ Successfully seeded Pinecone with the Dhammapada verses (768 Dimensions)!");
}

main().catch((err) => {
  console.error("Error during database seeding:", err);
  process.exit(1);
});