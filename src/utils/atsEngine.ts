import { ATSAnalysisResult } from "../types";

// Comprehensive catalog of typical professional and technical keywords used across industries.
const TECH_KEYWORDS = [
  // Languages & Markup
  "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "php", "golang", "go", "rust", 
  "swift", "kotlin", "html", "html5", "css", "css3", "sql", "nosql", "graphql", "shell", "bash", 
  "powershell", "r language", "scala", "dart", "sass", "less", "xml", "json", "yaml", "markdown",
  
  // Frameworks & Web Tech
  "react", "react.js", "reactjs", "angular", "angularjs", "vue", "vue.js", "vuejs", "next.js", "nextjs",
  "nuxt", "nuxt.js", "svelte", "express", "express.js", "expressjs", "nestjs", "django", "flask", 
  "fastapi", "spring boot", "spring", "rails", "ruby on rails", "laravel", "asp.net", "dotnet", "net core",
  "tailwind", "tailwindcss", "bootstrap", "material ui", "mui", "shadcn", "jquery", "redux", "zustand",
  "graphql", "apollo", "prisma", "sequelize", "mongoose", "hibernate", "flask", "fastapi", "gatsby",
  "electron", "capacitor", "cordova", "flutter", "react native", "xamarin", "ionic",
  
  // Databases & Caching
  "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb", "oracle", 
  "sql server", "firebase", "firestore", "mariadb", "neo4j", "couchdb", "elasticsearch", "elastic",
  
  // Infrastructure, Cloud & DevOps
  "git", "github", "gitlab", "bitbucket", "docker", "kubernetes", "k8s", "aws", "amazon web services", 
  "azure", "gcp", "google cloud", "google cloud platform", "vercel", "netlify", "heroku", "jenkins", 
  "github actions", "ci/cd", "continuous integration", "continuous deployment", "terraform", "ansible",
  "puppet", "chef", "docker compose", "nginx", "apache", "cloudflare", "aws s3", "ec2", "rds", "lambda",
  "serverless", "prometheus", "grafana", "sentry", "datadog", "circleci", "travis ci",
  
  // Systems & Architecture
  "microservices", "rest api", "restful", "restful api", "system design", "ood", "oop", "mvc", 
  "design patterns", "graphql api", "web sockets", "websocket", "jwt", "oauth", "oauth2", "saml",
  "event-driven architecture", "serverless architecture", "service mesh", "agile", "scrum", "kanban",
  
  // Testing
  "jest", "mocha", "chai", "cypress", "playwright", "selenium", "testing library", "junit", "pytest",
  "tdd", "test-driven development", "bdd", "unit testing", "integration testing", "e2e testing",
  
  // Machine Learning, AI & Data Science
  "machine learning", "ml", "artificial intelligence", "ai", "deep learning", "neural networks",
  "nlp", "natural language processing", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
  "pandas", "numpy", "matplotlib", "seaborn", "data science", "data analysis", "tableau", "power bi",
  "llm", "large language models", "generative ai", "langchain", "prompt engineering", "openai", "gemini",
  
  // Management & Design
  "project management", "scrum master", "product management", "ui/ux", "ui design", "ux design",
  "figma", "sketch", "adobe xd", "wireframing", "prototyping", "user research", "seo", "google analytics"
];

// Synonyms map to check for near/partial matches and avoid duplicate penalties
const SYNONYM_MAP: Record<string, string[]> = {
  "react": ["react.js", "reactjs"],
  "vue": ["vue.js", "vuejs"],
  "next.js": ["nextjs"],
  "express": ["expressjs", "express.js"],
  "node": ["node.js", "nodejs"],
  "typescript": ["ts"],
  "javascript": ["js"],
  "tailwind": ["tailwindcss"],
  "aws": ["amazon web services"],
  "gcp": ["google cloud", "google cloud platform"],
  "kubernetes": ["k8s"],
  "postgresql": ["postgres"],
  "rest api": ["restful", "restful api", "apis", "api integration"],
  "ci/cd": ["continuous integration", "continuous deployment"]
};

/**
 * Clean & tokenize text into unique words/phrases for matching
 */
function tokenize(text: string): Set<string> {
  const normalized = text.toLowerCase();
  
  // Replace symbols/punctuation with spaces to keep words distinct
  const cleaned = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’[\]]/g, " ");
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 1);
  return new Set(words);
}

/**
 * Searches text for exact keyword or phrase match (handles multi-word strings securely)
 */
function searchPhrase(text: string, phrase: string): boolean {
  const normalizedText = ` ${text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’[\]]/g, " ")} `;
  const normalizedPhrase = ` ${phrase.toLowerCase().trim()} `;
  return normalizedText.includes(normalizedPhrase);
}

export function analyzeResumeClientSide(resume: string, jd: string): ATSAnalysisResult {
  const normResume = resume.toLowerCase();
  const normJd = jd.toLowerCase();
  
  // ---- 1. EXTRAC KEYWORDS FROM JOB DESCRIPTION ----
  // We scan the JD for known tech terms, languages, methods, or tools
  const jdKeywordsInScope = TECH_KEYWORDS.filter(term => searchPhrase(normJd, term));
  
  // Deduplicate keywords that are closely-related synonyms
  const jdKeywords: string[] = [];
  const handledSynonyms = new Set<string>();

  for (const kw of jdKeywordsInScope) {
    if (handledSynonyms.has(kw)) continue;
    
    // Add words to deduplication pool
    jdKeywords.push(kw);
    handledSynonyms.add(kw);
    
    // Mark synonyms as handled
    for (const [primary, list] of Object.entries(SYNONYM_MAP)) {
      if (primary === kw || list.includes(kw)) {
        handledSynonyms.add(primary);
        list.forEach(s => handledSynonyms.add(s));
      }
    }
  }

  // Fallback default keywords if none extracted to ensure scoring holds
  if (jdKeywords.length === 0) {
    jdKeywords.push("technical skills", "experience", "communication");
  }

  // ---- 2. MATCH KEYWORDS IN RESUME ----
  const keywords_found: string[] = [];
  const keywords_missing: string[] = [];
  const keywords_partial: string[] = [];

  for (const kw of jdKeywords) {
    // 1. Direct match check
    if (searchPhrase(normResume, kw)) {
      keywords_found.push(capitalizeWords(kw));
      continue;
    }

    // 2. Near-synonym match check
    let synonymMatched = false;
    for (const [primary, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (primary === kw || synonyms.includes(kw)) {
        // Did user have the primary or any synonyms?
        const matchOfPrimary = searchPhrase(normResume, primary);
        const matchOfSynonym = synonyms.find(s => searchPhrase(normResume, s));
        
        if (matchOfPrimary || matchOfSynonym) {
          const foundAlternative = matchOfPrimary ? primary : (matchOfSynonym || "");
          keywords_partial.push(`Asked: ${capitalizeWords(kw)} / Found alternative: ${capitalizeWords(foundAlternative)}`);
          synonymMatched = true;
          break;
        }
      }
    }

    if (!synonymMatched) {
      keywords_missing.push(capitalizeWords(kw));
    }
  }

  // ---- 3. CALCULATE MATCH METRICS ----
  const foundCount = keywords_found.length;
  const partialCount = keywords_partial.length;
  const missingCount = keywords_missing.length;
  const totalCount = foundCount + partialCount + missingCount;

  // Weight direct matches full, partial matches 0.5
  const keywordScoreRaw = totalCount > 0 
    ? ((foundCount + (partialCount * 0.5)) / totalCount) * 100 
    : 70;
  const keyword_match_pct = Math.round(keywordScoreRaw);

  // ---- 4. STRUCTURE & FORMATTING METRICS AUDIT ----
  let formatScoreRaw = 100;
  const formattingDeductions: string[] = [];

  const sectionsToInquire = [
    { name: "experience", words: ["experience", "employment history", "work history", "career history"] },
    { name: "education", words: ["education", "academic", "university", "college", "degree"] },
    { name: "skills", words: ["skills", "core competencies", "technologies", "technical skills"] },
    { name: "projects", words: ["projects", "personal projects", "portfolio"] },
    { name: "summary", words: ["summary", "profile", "about me", "professional summary", "objective"] }
  ];

  const foundSections: string[] = [];
  for (const sect of sectionsToInquire) {
    const isSectionPresent = sect.words.some(word => normResume.includes(word));
    if (!isSectionPresent) {
      formatScoreRaw -= 10;
      formattingDeductions.push(`Add a distinct, clearly capitalized '${capitalizeWords(sect.name)}' heading section.`);
    } else {
      foundSections.push(sect.name);
    }
  }

  // Check for email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (!emailRegex.test(resume)) {
    formatScoreRaw -= 12;
    formattingDeductions.push("Email address not found. Ensure your contact email is clearly visible in the header.");
  }

  // Check for links profiles (LinkedIn or GitHub)
  if (!normResume.includes("linkedin.com") && !normResume.includes("github.com")) {
    formatScoreRaw -= 8;
    formattingDeductions.push("Professional social profiles omitted. Best practice is to link your LinkedIn and GitHub portfolios.");
  }

  // Check for length & excessive formatting issues
  const wordsCount = resume.trim().split(/\s+/).length;
  if (wordsCount < 150) {
    formatScoreRaw -= 15;
    formattingDeductions.push("Your resume text has extremely low word count. Expand your descriptive bullets under each project & experience panel.");
  } else if (wordsCount > 750) {
    formatScoreRaw -= 5;
    formattingDeductions.push("Your resume exceeds 750 words. Be more concise to ensure an optimal human & ATS structural scan.");
  }

  const format_score = Math.max(30, Math.round(formatScoreRaw));

  // ---- 5. SENIORITY & EXPERIENCE ALIGNMENT ----
  let experience_match = 80; // Baseline
  // Check for years keyword & numbers in the vicinity
  const jdYearsMatch = normJd.match(/(\d+)\+?\s*years?/);
  if (jdYearsMatch) {
    const askedYears = parseInt(jdYearsMatch[1]);
    const resumeYearsMatch = normResume.match(/(\d+)\+?\s*years?/g);
    
    if (resumeYearsMatch) {
      let maxResumeYears = 0;
      resumeYearsMatch.forEach(y => {
        const parsed = parseInt(y.match(/\d+/)?.at(0) || "0");
        if (parsed > maxResumeYears) maxResumeYears = parsed;
      });

      if (maxResumeYears < askedYears) {
        experience_match = Math.max(40, 90 - (askedYears - maxResumeYears) * 15);
        formattingDeductions.push(`The JD asks for ${askedYears}+ years of experience, but your resume emphasizes ${maxResumeYears || 0} years. Make sure to clearly write cumulative timeline metrics.`);
      } else {
        experience_match = 95;
      }
    } else {
      // Mentioned years of experience in JD but user hasn't written the word "years" or "years of experience".
      experience_match = 65;
      formattingDeductions.push(`The JD seeks specific years of track record, but the term 'years of experience' or concrete duration metrics are not clearly parsed in your profile.`);
    }
  }

  // ---- 6. SKILLS MATCH ALIGNMENT ----
  // We compare specific industry technical categories
  const skills_match = Math.round(keyword_match_pct * 0.95 + (format_score * 0.05));

  // ---- 7. CALCULATE THE OVERALL ATS COMPATIBILITY SCORE ----
  // Weighted overall compatibility score
  const overallScore = Math.round(
    (keyword_match_pct * 0.45) + 
    (format_score * 0.25) + 
    (experience_match * 0.20) + 
    (skills_match * 0.10)
  );

  const score = Math.max(10, Math.min(99, overallScore));

  // ---- 8. OVERALL GRADE CATEGORIZATION ----
  let grade = "Poor";
  if (score >= 80) grade = "Excellent";
  else if (score >= 70) grade = "Good";
  else if (score >= 50) grade = "Fair";

  // ---- 9. DETAILED HONEST COMPRESSED ASSESSMENT SUMMARY ----
  let summary = "";
  if (score >= 80) {
    summary = `Your resume holds an outstanding alignment of ${score}%. Key technical terms, framework references, and critical requirements are beautifully matched, yielding optimal positioning for automated ATS screening.`;
  } else if (score >= 70) {
    summary = `Your profile shows a good alignment of ${score}%. While core requirements and experiences match standard expectations, you can easily elevate your match rate by explicitly incorporating the missing keywords.`;
  } else if (score >= 50) {
    summary = `Your resume has fair compatibility at ${score}%. The scanner found significant skill gaps and missing keyword metrics. Use the checklist below to insert critical industry parameters of the JD into your highlights.`;
  } else {
    summary = `Your profile score is critical (${score}%). Multiple central technologies and formatting structures are missing. Rebuild your resume's experience block to target the specific keyword parameters defined in the job description.`;
  }

  // ---- 10. ACTIONABLE SUGGESTIONS LIST ----
  const tips: string[] = [];
  
  // Format-based suggestions
  formattingDeductions.slice(0, 3).forEach(d => tips.push(d));

  // Keyword missing-based suggestion
  if (keywords_missing.length > 0) {
    const missingSample = keywords_missing.slice(0, 4).join(", ");
    tips.push(`Directly weave these missing keyword credentials into your work experience: ${missingSample}.`);
  }

  // Action verbs or formatting best-practice check
  if (!normResume.includes("led") && !normResume.includes("driven") && !normResume.includes("designed") && !normResume.includes("optimized")) {
    tips.push("Elevate passive language with powerful, impact-driven action verbs (e.g., 'Optimized performance of...', 'Led development on...', 'Designed systems architecture...').");
  }

  if (tips.length < 3) {
    tips.push("Always distribute your core technologies across active bullet descriptions rather than concentrating them solely in a 'Skills' box.");
    tips.push("Verify that your resume is styled as a one or two-column clean linear layout to optimize machine OCR precision.");
  }

  return {
    score,
    grade,
    summary,
    keyword_match_pct,
    format_score,
    experience_match,
    skills_match,
    keywords_found: keywords_found.slice(0, 12),
    keywords_missing: keywords_missing.slice(0, 12),
    keywords_partial: keywords_partial.slice(0, 8),
    tips: tips.slice(0, 5)
  };
}

function capitalizeWords(str: string): string {
  if (str.length <= 3) return str.toUpperCase(); // React, CLI, AWS, ML, AI, etc.
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
