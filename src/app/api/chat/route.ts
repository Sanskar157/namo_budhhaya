import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@huggingface/transformers";
import { model } from "../../../lib/langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Initialize Pinecone outside the handler for connection caching
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const index = pinecone.Index("dhammapada");

// Cache the local embedding extractor model so it doesn't reload on every request
let extractorPromise: Promise<any> | null = null;
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractorPromise;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Embed the user's question locally into a 384-dimensional vector
    const extractor = await getExtractor();
    const output = await extractor(message, { pooling: "mean", normalize: true });
    const queryVector = output.tolist()[0];

    // 2. Query Pinecone for the top 4 most relevant verses
    const searchResults = await index.query({
      vector: queryVector,
      topK: 4,
      includeMetadata: true,
    });

    // 3. Format the retrieved verses into a readable context block
    const contextText = searchResults.matches
      .map((match: any) => {
        const meta = match.metadata;
        return `[Chapter ${meta.chapterNumber}: ${meta.chapterName}, Verse ${meta.verseNumber}]\nText: ${meta.pageContent}`;
      })
      .join("\n\n");

    // 4. Construct the RAG System Prompt
    const systemInstruction = `
      You are a wise, compassionate Buddhist teacher and scholar bot. 
      Your task is to answer the user's questions strictly based on the teachings of the Dhammapada provided in the context below.
      
      Retrieved Verses:
      <Context>
      ${contextText}
      </Context>

      Guidelines:
      1. Base your answer ONLY on the provided context. If the answer is not in the context, politely state that the retrieved verses do not cover this specific topic.
      2. Always cite the Chapter Name and Verse Number you used to formulate your response.
      3. Maintain a calm, serene, and instructive tone.
    `;

    // 5. Build messages and invoke your configured ChatGoogleGenerativeAI model
    const systemMessage = new SystemMessage(systemInstruction);
    const userMessage = new HumanMessage(message);

    const aiResponse = await model.invoke([systemMessage, userMessage]);

    // Handle string or content block return types securely
    const textResponse = typeof aiResponse.content === "string" 
      ? aiResponse.content 
      : JSON.stringify(aiResponse.content);

    return NextResponse.json({ response: textResponse }, { status: 200 });
  } catch (error) {
    console.error("Error in chatbot API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}