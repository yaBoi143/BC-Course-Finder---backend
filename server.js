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

let matchedCareers = [];

if (!matchedCourse) {
  const query = userMessage.toLowerCase();

  const hasMaths = query.includes("math");
  const hasScience = query.includes("physical science");
  const hasIT =
    query.includes("information technology") ||
    query.includes("it");

  matchedCareers = Object.values(courseData).filter(course => {
    const subjects = course.subjects.map(s => s.toLowerCase());

    let matches = true;

    if (hasMaths) {
      matches = matches && subjects.includes("mathematics");
    }

    if (hasScience) {
      matches = matches && subjects.includes("physical science");
    }

    if (hasIT) {
      matches = matches && subjects.includes("information technology");
    }

    return matches;
  });
}

let useDatabase = true;

if (!matchedCourse && matchedCareers.length === 0) {
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
${
  matchedCourse
    ? JSON.stringify(matchedCourse, null, 2)
    : matchedCareers.length > 0
      ? JSON.stringify(matchedCareers, null, 2)
      : "No matching careers found in the Belgium Campus database."
}

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

IMPORTANT RULES FOR CAREER RECOMMENDATIONS:

- You are STRICTLY limited to careers that exist in the provided course database (courses.json)
- You MUST NOT invent, assume, or suggest any careers that are not explicitly listed in the database

When the user asks a general question like:
"what can I do with Maths and Physical Science"

You must:
1. ONLY look at careers that exist in the database
2. Match them ONLY based on their listed required subjects
3. If no careers match, respond exactly:
   "No matching careers found in the Belgium Campus database for these subjects."

ABSOLUTE RULE:
- Even if the user asks for advice, examples, or suggestions, you are NOT allowed to introduce external careers or general industry roles.
- Only rephrase or explain careers that already exist in the database.

Format:
- Use simple headings
- Use dot points for lists
Formatting rules:
- Do NOT use asterisks (*) for lists
- Use numbered or clean line-separated formatting
- Avoid markdown syntax

If a specific career exists in the database:
- Use ONLY the database information

If no matching careers are found in the database:
- Respond with:
"No matching careers found in the Belgium Campus database."
- Do not suggest alternative careers.
- Do not use general IT career knowledge.

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