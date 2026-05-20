import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";


console.log("DEPLOY VERSION 2 - GROQ ACTIVE");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const API_KEY = process.env.GROQ_API_KEY;

const courseData = JSON.parse(
  fs.readFileSync("courses.json", "utf-8")
);


app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const career = userMessage.toLowerCase();

  let matchedCourse = null;

  for (const key in courseData) {
    if (career.includes(key)) {
      matchedCourse = courseData[key];
      break;
    }
  }

let useDatabase = true;

if (!matchedCourse) {
  useDatabase = false;
}

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
          model: "llama-3.1-8b-instant",
          messages: [
            {
               role: "system",
  content: `
You are BC CourseFinder™, an AI assistant for South African matric students.

If course data is provided below, use it:
${matchedCourse ? JSON.stringify(matchedCourse, null, 2) : "No specific course matched. Answer using general IT career knowledge."}

IMPORTANT RULES:
- Only answer questions about IT careers
- ONLY recommend Belgium Campus iTversity study pathways
- Do NOT mention any other universities
- Do NOT invent or guess information outside the provided data
- If information is missing, say it is not available in the database

When answering:
- Explain the career
- Mention required subjects
- Mention important skills
- Mention qualification
- Mention entry-level jobs

Format:
- Use simple headings
- Use dot points for lists

If a specific career exists in the database:
- Use ONLY the database information

If the question is NOT in the database BUT is still related to IT studies, careers, or subjects:
- Answer using general knowledge about IT education and careers
- Do NOT use or invent Belgium Campus pathways

If the question is unrelated to IT:
- Politely say you only assist with IT and study-related guidance
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