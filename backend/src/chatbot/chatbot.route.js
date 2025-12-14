const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: question },
      ],
      temperature: 0.4,
      max_tokens: 512,
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    res.status(500).json({
      answer: "⚠️ Error: Groq AI service is unavailable.",
    });
  }
});

module.exports = router;
