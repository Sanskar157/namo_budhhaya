import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { InferenceClient } from "@huggingface/inference";
import { model } from "../../../lib/langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 1. Initialize Pinecone outside the handler for connection caching
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const index = pinecone.Index("dhammapada");

// 2. Initialize the remote Hugging Face API client
// Make sure you have HF_TOKEN in your .env or Vercel environment variables
const hf = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 3. Embed the user's question using Hugging Face's API
    // We use featureExtraction to get the 384-dimensional vector array
    const embeddingResponse = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: message,
    });
    
    // The Inference API returns the raw array of numbers for the single string input
    const queryVector = embeddingResponse as number[];

    // 4. Query Pinecone for the top 4 most relevant verses
    const searchResults = await index.query({
      vector: queryVector,
      topK: 4,
      includeMetadata: true,
    });

    // 5. Format the retrieved verses into a readable context block
    const contextText = searchResults.matches
      .map((match: any) => {
        const meta = match.metadata;
        return `[Chapter ${meta.chapterNumber}: ${meta.chapterName}, Verse ${meta.verseNumber}]\nText: ${meta.pageContent}`;
      })
      .join("\n\n");

    // 6. Construct the RAG System Prompt
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

    // 7. Build messages and invoke your configured ChatGoogleGenerativeAI model
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