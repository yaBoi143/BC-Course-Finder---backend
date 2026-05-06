import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Groq API key (NOT Gemini)
const API_KEY = process.env.GROQ_API_KEY;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: `
You are BC CourseFinder™, an AI assistant for South African matric students.

Rules:
- Only answer IT career questions
- Keep answers simple
- Do not ask for personal info
              `
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      }
    );

    const text = await response.text();
    console.log("GROQ RAW RESPONSE:", text);

    if (!response.ok) {
      return res.json({
        reply: "⚠️ AI request failed (check server logs)"
      });
    }

    const data = JSON.parse(text);

    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t respond.";

    res.json({ reply });

  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).json({
      reply: "⚠️ Server error occurred"
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});