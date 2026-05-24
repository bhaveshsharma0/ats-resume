import { GoogleGenAI, Type } from "@google/genai";

// Lazy init of GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please map it in your Vercel/environment settings.");
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

export default async function handler(req: any, res: any) {
  // Access control or custom options pre-flight check
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { resume, jd } = req.body;

    if (!resume || !jd) {
      return res.status(400).json({ error: "Both resume text and job description text are required." });
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
    return res.status(200).json(analyzedResult);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during resume analysis. Please try again." 
    });
  }
}
