const express = require("express");
const axios = require("axios");

const router = express.Router();

// URL of the Python AI Service (Dynamic from Environment Variable)
const BASE_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");
const AI_SERVICE_URL = `${BASE_URL}/chat`;
const AI_SERVICE_STREAM_URL = `${BASE_URL}/chat-stream`;


router.post("/ask", async (req, res) => {
  const { question, session_id } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // Proxy the request to the Python AI Service
    const response = await axios.post(AI_SERVICE_URL, {
      question,
      session_id,
    });

    // Python service returns { answer, session_id }
    res.json(response.data);
  } catch (error) {
    console.error("AI Service Error:", {
      message: error.message,
      url: AI_SERVICE_URL,
      status: error.response?.status,
      data: error.response?.data,
    });
    res.status(500).json({
      answer: "⚠️ AI service is currently unavailable. Please try again later.",
      error: error.message,
    });
  }
});

router.post("/ask-stream", async (req, res) => {
  const { question, session_id } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Make streaming request to AI service
    const response = await axios.post(
      AI_SERVICE_STREAM_URL,
      {
        question,
        session_id,
      },
      {
        responseType: "stream",
      }
    );

    // Pipe the stream from AI service to client
    response.data.pipe(res);

    // Handle errors on the stream
    response.data.on("error", (error) => {
      console.error("Stream error:", error);
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      response.data.destroy();
    });
  } catch (error) {
    console.error("AI Service Streaming Error:", {
      message: error.message,
      url: AI_SERVICE_STREAM_URL,
      status: error.response?.status,
      data: error.response?.data,
    });
    res.write(
      `data: ${JSON.stringify({
        chunk: "⚠️ AI service is currently unavailable. Please try again later.",
        done: true,
      })}\n\n`
    );
    res.end();
  }
});

module.exports = router;
