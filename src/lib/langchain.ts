import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

export const model = new ChatGoogleGenerativeAI({
  apiKey,
  model: "gemini-3.1-flash-lite", 
});
