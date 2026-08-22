import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import axios from "axios";

async function runGenerations() {
  const datasetPath = path.join(process.cwd(), "scripts", "eval_questions.json");
  const outputPath = path.join(process.cwd(), "scripts", "eval_results.json");

  // Load the questions
  const dataset = JSON.parse(readFileSync(datasetPath, "utf-8"));
  const results = [];

  console.log(`Starting evaluation run for ${dataset.length} questions...`);

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    console.log(`\n[${i + 1}/${dataset.length}] Asking: "${item.query}"`);

    try {
      // const API_URL = "https://namo-buddhaya-beta.vercel.app/api/chat";
      const API_URL = "http://localhost:3000/api/chat"; // Use this for local testing

      // Match the payload expected by your route.ts
      const res = await axios.post(
        API_URL,
        { message: item.query },
        { headers: { "Content-Type": "application/json" } }
      );

      results.push({
        query: item.query,
        generated_answer: res.data.response,
        retrieved_context: res.data.context || ""
      });

      console.log("✅ Received response");

      // Pause to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(
        `❌ Failed on question ${i + 1}:`,
        error.response?.data || error.message
      );
    }
  }

  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n🎉 Done! Results saved to ${outputPath}`);
}

runGenerations();