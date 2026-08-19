"use client";

import { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await axios.post("/api/chat", { message });
      const textResponse = res.data.response || "No response";
      setResponse(textResponse);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error fetching response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[70vh] px-4 mt-10">
      <p className="text-lg text-gray-300 text-center text-base max-w-xl mb-6">
        Ask our Buddhist chatbot about the Dhamma, mindfulness, or the path to Nirvana.
      </p>

      <div className="w-full max-w-xl">
        <textarea
          ref={textareaRef}
          className="w-full p-3 text-base bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none overflow-hidden"
          placeholder="Ask me anything about buddhism..."
          rows={2}
          value={message}
          onChange={handleInput}
        />

        <div className="flex justify-end mt-2">
          <button
            className="bg-yellow-500 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition active:scale-95"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-yellow-400 animate-pulse">Generating answer...</div>
        )}

        {!loading && response && (
          <div className="mt-4 bg-gray-900 p-4 text-base rounded-lg border border-gray-700 text-gray-200 prose prose-invert">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
