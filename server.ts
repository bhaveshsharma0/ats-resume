import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy init of GoogleGenAI client to avoid crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST APIs
app.post("/api/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { resume, jd } = req.body;

    if (!resume || !jd) {
      res.status(400).json({ error: "Both resume text and job description text are required." });
      return;
    }

    const ai = getAiClient();

    const systemInstruction = 
      "You are an elite ATS (Applicant Tracking System) resume auditor and hiring systems engineer. " +
      "Your core mandate is to compare resumes against job descriptions with high accuracy, objectivity, and constructive rigor. " +
      "Rate the parameters critically like an actual scanner would, searching for direct matching, synonyms, context, and structural formatting problems. " +
      "Provide precise keyword mapping (exact found, missing, and partial synonyms/sub-specialties) and highly professional, tactical feedback.";

    const prompt = `Please audit this resume against this job description. Make sure to map out keyword overlaps, gaps, and actionable changes.

RESUME TEXT:
${resume}

JOB DESCRIPTION TEXT:
${jd}
`;

    // Leverage Gemini 3.5 Flash for accurate resume-to-JD JSON parsing
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "Overall ATS compatibility score from 0 to 100 based on rigorous matching." 
            },
            grade: { 
              type: Type.STRING, 
              description: "Rigorous alignment grade: Excellent (80-100), Good (70-79), Fair (50-69), Poor (0-49)" 
            },
            summary: { 
              type: Type.STRING, 
              description: "A constructive, direct 2-3 sentence overview on why the score was assigned and how well it matches the JD." 
            },
            keyword_match_pct: { 
              type: Type.INTEGER, 
              description: "Match percentage of key technical terms, tools, methodologies, and core skills: 0 to 100" 
            },
            format_score: { 
              type: Type.INTEGER, 
              description: "Formatting and structure ATS legibility score: 0 to 100. Evaluate typical resume parts, legibility of dates, section headings, and layout simplicity." 
            },
            experience_match: { 
              type: Type.INTEGER, 
              description: "Match score for seniority level, responsibilities, industry focus, and achievements relative to the JD: 0 to 100" 
            },
            skills_match: { 
              type: Type.INTEGER, 
              description: "Technical / functional skills matching percentage: 0 to 100" 
            },
            keywords_found: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of key job-relevant terms (max 12 essential items) successfully located in the resume."
            },
            keywords_missing: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of core requirements, technologies, or buzzwords from the JD that are not in the resume."
            },
            keywords_partial: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of partial or conceptual soft-matches (e.g. knew 'PostgreSQL' when the JD asked for 'SQL database', or 'React' for 'Next.js'). Show in format: 'Asked: X / Found: Y' or simply 'React' -> 'Next.js'."
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 clear, highly tactical, actionable formatting/content editing suggestions to boost ATS success."
            }
          },
          required: [
            "score",
            "grade",
            "summary",
            "keyword_match_pct",
            "format_score",
            "experience_match",
            "skills_match",
            "keywords_found",
            "keywords_missing",
            "keywords_partial",
            "tips"
          ]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini.");
    }

    const analyzedResult = JSON.parse(responseText.trim());
    res.json(analyzedResult);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred during resume analysis. Please try again." 
    });
  }
});

// Setup Vite Dev Middleware / Static Production Serve
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failure:", err);
});
