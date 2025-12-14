import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import baseURL from "../utils/baseURL";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${baseURL}/api/chatbot/ask`, {
        question: input,
      });

      const botMsg = { sender: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ AI service is unavailable." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="w-96 h-[450px] bg-white shadow-2xl rounded-2xl p-4 border flex flex-col mb-3">
          <div className="flex justify-between mb-2">
            <h2 className="font-bold">🤖 AI Bookstore Assistant</h2>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 bg-gray-50 p-3 rounded">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-green-100 ml-auto text-right"
                    : "bg-gray-200"
                }`}
              >
                {msg.sender === "bot" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && <div className="italic text-sm">AI is typing…</div>}
          </div>

          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 border p-2 rounded"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about books..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow"
      >
        {open ? "−" : "💬"}
      </button>
    </div>
  );
}
