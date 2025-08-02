// src/chatbot/chatbot.route.js
const express = require("express");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // you can use gemini-1.5-pro as well

/**
 * Chatbot Endpoint
 */
router.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "❌ Question is required" });
  }

  try {
    // ✅ Generate response from Gemini
    const result = await model.generateContent(question);
    const answer = result.response.text();

    res.json({ answer });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res
      .status(500)
      .json({ answer: "⚠️ Error: Gemini AI service is unavailable." });
  }
});

module.exports = router;
