import json
import os
import re
import time
import pandas as pd
from google import genai
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# 1. Configure the NEW Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ Error: GEMINI_API_KEY is not set.")
    exit(1)

client = genai.Client(api_key=api_key)
MODEL_ID = "gemini-3.5-flash-lite"

# 2. Helper to extract float scores (0.0 to 1.0) from LLM output
def parse_score(text: str) -> float:
    match = re.search(r"Score:\s*([0-1](?:\.\d+)?)", text, re.IGNORECASE)
    if match:
        return float(match.group(1))
    fallback = re.findall(r"\b(0\.\d+|1\.0|0|1)\b", text)
    if fallback:
        return float(fallback[0])
    return 0.5

# 3. Define the RAG Triad Evaluators (Using the new client.models.generate_content syntax)
def eval_context_relevance(query: str, context: str) -> float:
    prompt = f"""
You are an impartial judge evaluating a RAG pipeline.
Task: Evaluate the Context Relevance of the retrieved text to the user's question.
Does the retrieved context contain information relevant to answering the question?

User Question: {query}
Retrieved Context: {context}

Output format:
Reasoning: <one-sentence explanation>
Score: <a float between 0.0 (completely irrelevant) and 1.0 (highly relevant)>
"""
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    return parse_score(response.text)

def eval_faithfulness(context: str, answer: str) -> float:
    prompt = f"""
You are an impartial judge evaluating a RAG pipeline.
Task: Evaluate the Faithfulness / Groundedness of the answer against the retrieved context.
Is every claim in the answer directly supported by the context without hallucination or external knowledge?

Retrieved Context: {context}
Generated Answer: {answer}

Output format:
Reasoning: <one-sentence explanation>
Score: <a float between 0.0 (completely hallucinated/unsupported) and 1.0 (fully grounded)>
"""
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    return parse_score(response.text)

def eval_answer_relevance(query: str, answer: str) -> float:
    prompt = f"""
You are an impartial judge evaluating a RAG pipeline.
Task: Evaluate the Answer Relevance of the response to the user's question.
Does the answer directly address the user's intent and question?

User Question: {query}
Generated Answer: {answer}

Output format:
Reasoning: <one-sentence explanation>
Score: <a float between 0.0 (completely off-topic) and 1.0 (direct and helpful answer)>
"""
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    return parse_score(response.text)

# 4. Load your dataset
print("Loading eval_results.json...")
try:
    with open("scripts/eval_results.json", "r") as f:
        results = json.load(f)
except FileNotFoundError:
    print("❌ Error: Could not find scripts/eval_results.json")
    exit(1)

print(f"Evaluating {len(results)} interactions across the RAG Triad...")
print("Note: Adding a 4-second delay between queries to respect Free Tier rate limits.\n")

records = []
for i, item in enumerate(results):
    q = item.get("query", "")
    a = item.get("generated_answer", "")
    c = str(item.get("retrieved_context", ""))

    try:
        cr = eval_context_relevance(q, c)
        time.sleep(2) # Stagger requests
        
        f_score = eval_faithfulness(c, a)
        time.sleep(2)
        
        ar = eval_answer_relevance(q, a)

        records.append({
            "Query": q[:35] + "...",
            "Context Relevance": cr,
            "Faithfulness": f_score,
            "Answer Relevance": ar
        })
        print(f"✅ Evaluated [{i + 1}/{len(results)}]: {q[:40]}...")
        
        # Main cooldown between full test cases
        time.sleep(4) 
        
    except Exception as e:
        print(f"⚠️ Error evaluating item {i + 1}: {e}")
        time.sleep(10) # Heavy backoff if we still hit a limit

# 5. Output Leaderboard and Summary
if records:
    df_all = pd.DataFrame(records)

    print("\n" + "=" * 65)
    print("📊 INDIVIDUAL TEST CASE SCORES")
    print("=" * 65)
    print(df_all.to_string(index=False))

    leaderboard = pd.DataFrame({
        "Context Relevance": [df_all["Context Relevance"].mean()],
        "Faithfulness": [df_all["Faithfulness"].mean()],
        "Answer Relevance": [df_all["Answer Relevance"].mean()],
        "Total Test Cases": [len(df_all)]
    }, index=["Dhammapada_Bot"])

    print("\n" + "=" * 65)
    print("🏆 AGGREGATE RAG TRIAD LEADERBOARD")
    print("=" * 65)
    print(leaderboard.round(2).to_string())
    print("=" * 65)