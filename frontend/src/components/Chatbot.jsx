import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // ✅ Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://bookstore-ai-backend-am25.onrender.com/api/chatbot/ask",
        { question: input }
      );
      const botMsg = { sender: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ AI service is currently unavailable." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* ✅ Chat Window (Dropdown) */}
      {open && (
        <div className="w-96 h-[450px] bg-white shadow-2xl rounded-2xl p-4 border border-gray-300 flex flex-col mb-3 transform transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🤖 AI Bookstore Assistant
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-red-500 text-xl font-bold"
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-green-100 ml-auto text-right"
                    : "bg-gray-200 text-left"
                }`}
              >
                {msg.sender === "bot" ? (
                  <>
                    {/* ✅ Render Markdown for Bot Messages */}
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </>
                ) : (
                  msg.text
                )}
              </div>
            ))}

            {loading && (
              <div className="bg-gray-200 px-3 py-2 rounded-lg text-sm italic text-gray-600 w-fit">
                AI is typing...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ask me about books..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ✅ Floating Button to Toggle Chat */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 transition-all"
      >
        {open ? "−" : "💬"}
      </button>
    </div>
  );
}
