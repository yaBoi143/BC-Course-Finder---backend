import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
   const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are BC CourseFinder™, an AI assistant for South African matric students.

Rules:
- Only answer IT career questions
- Keep answers simple
- Do not ask for personal info

User question:
${userMessage}
`
            }
          ]
        }
      ]
    })
  }
);

// ❌ HANDLE ERRORS FIRST
if (!response.ok) {
  const errorText = await response.text();
  console.log("🔥 GEMINI ERROR:", errorText);

  if (errorText.includes("RetryInfo")) {
    return res.json({
      reply: "⏳ The AI is a bit busy right now, please try again in a moment."
    });
  }

  return res.json({
    reply: "⚠️ Something went wrong with the AI."
  });
}

// ✅ ONLY parse JSON if successful
const data = await response.json();

console.log("GEMINI RAW RESPONSE:", JSON.stringify(data, null, 2));

const reply =
  data.candidates?.[0]?.content?.parts?.[0]?.text ||
  "Sorry, I couldn’t respond.";

res.json({ reply });
    
  } catch (error) {
    res.status(500).json({ error: "Error occurred" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
