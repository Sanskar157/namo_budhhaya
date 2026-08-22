import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { InferenceClient } from "@huggingface/inference";
import { model } from "../../../lib/langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Ensure your index is set to Dimension: 768 and Metric: cosine
const index = pinecone.Index("dhammapada");

// Initialize Hugging Face Inference Client
const hf = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Fetch 768-dimension Dense Embedding via Hugging Face Inference API using optimized query
    const embeddingResponse = await hf.featureExtraction({
      model: "BAAI/bge-base-en-v1.5",
      inputs: message,
    });
    
    // Flatten the array to guarantee it is a 1D vector
    const queryVector = (embeddingResponse as any[]).flat(Infinity);

    // 2. Query Pinecone (Two-Stage Retrieval: Cast a wider net with topK: 12)
    const searchResults = await index.query({
      vector: queryVector,
      topK: 12,
      includeMetadata: true,
    });

    // Take the top 4 highest-scoring matches from the wider pool
    const topMatches = (searchResults.matches ?? []).slice(0, 4);

    // 3. Extract context using only verse numbers
    const contextText = topMatches
      .map((match: any) => {
        const meta = match.metadata ?? {};
        return `[Verse ${meta.verseNumber ?? "Unknown"}]\nText: ${meta.pageContent ?? ""}`;
      })
      .join("\n\n");

    // 4. Build system prompt
    const systemInstruction = `
      You are a wise, compassionate Buddhist teacher and scholar bot. 
      Your task is to answer the user's questions strictly based on the teachings of the Dhammapada provided in the context below.
      
      Retrieved Verses:
      <Context>
      ${contextText}
      </Context>

      Guidelines:
      1. Base your answer ONLY on the provided context. If the answer is not in the context, politely state that the retrieved verses do not cover this specific topic.
      2. Always cite the Verse Number you used to formulate your response.
      3. Maintain a calm, serene, and instructive tone.
    `;

    const systemMessage = new SystemMessage(systemInstruction);
    const userMessage = new HumanMessage(message);

    // 5. Invoke Gemini via Langchain
    const aiResponse = await model.invoke([systemMessage, userMessage]);

    const textResponse = typeof aiResponse.content === "string" 
      ? aiResponse.content 
      : JSON.stringify(aiResponse.content);

    // 6. Return response and context
    return NextResponse.json({ 
      response: textResponse,
      context: contextText 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error in chatbot API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}