import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { HiOutlineChatAlt2, HiX, HiPaperAirplane } from "react-icons/hi";
import baseURL from "../utils/baseURL";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // Use fetch for streaming
      const response = await fetch(`${baseURL}/api/chatbot/ask-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentInput,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamingText = "";
      let streamingSessionId = null;

      // Add an empty bot message that we'll update as chunks arrive
      const botMessageIndex = messages.length + 1;
      setMessages((prev) => [...prev, { sender: "bot", text: "" }]);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value);
        
        // Split by newlines to handle multiple SSE messages
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.chunk) {
                streamingText += data.chunk;
                // Update the last message with accumulated text
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[botMessageIndex] = {
                    sender: "bot",
                    text: streamingText,
                  };
                  return newMessages;
                });
              }
              
              if (data.done) {
                streamingSessionId = data.session_id;
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Update session ID if we got one
      if (streamingSessionId) {
        setSessionId(streamingSessionId);
      }

    } catch (err) {
      console.error("Streaming error, falling back to regular mode:", err);
      
      // Fallback to non-streaming mode
      try {
        const res = await axios.post(`${baseURL}/api/chatbot/ask`, {
          question: currentInput,
          session_id: sessionId,
        });

        if (res.data.session_id) {
          setSessionId(res.data.session_id);
        }

        const botMsg = { sender: "bot", text: res.data.answer };
        setMessages((prev) => [...prev, botMsg]);
      } catch (fallbackErr) {
        console.error("Chatbot error:", fallbackErr);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "AI service is currently unavailable. Please try again later." },
        ]);
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-primary">
      {/* Chat Window */}
      {open && (
        <div className="w-[380px] sm:w-[420px] h-[550px] bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden animate-chat-open">
          
          {/* Header */}
          <div className="bg-secondary p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <HiOutlineChatAlt2 className="text-primary text-xl" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight">AI Bookstore Assistant</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-300 text-[10px] uppercase font-semibold tracking-wider">Online Now</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <HiX className="text-xl" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-gray-50/50" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <HiOutlineChatAlt2 className="text-gray-200 text-6xl mb-2" />
                <p className="text-gray-400 text-sm">Hi! Ask me anything about our books or for a recommendation.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "bg-secondary text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  <div className="markdown-content prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 rounded-tl-none shadow-sm flex items-center">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 focus-within:border-primary/50 transition-all shadow-inner">
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm text-gray-700 placeholder:text-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-lg transition-all ${
                  input.trim() && !loading 
                    ? "bg-primary text-secondary cursor-pointer shadow-sm hover:scale-105 active:scale-95" 
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <HiPaperAirplane className="text-lg rotate-90" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-medium tracking-tight">Powered by Advanced RAG AI Service</p>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform ${
          open ? "rotate-180 bg-favorite" : "bg-secondary hover:scale-110 active:scale-90"
        } text-white`}
      >
        {open ? <HiX className="text-2xl" /> : <HiOutlineChatAlt2 className="text-3xl" />}
      </button>
    </div>
  );
}
