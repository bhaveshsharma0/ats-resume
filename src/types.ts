export interface ATSAnalysisResult {
  score: number;
  grade: string;
  summary: string;
  keyword_match_pct: number;
  format_score: number;
  experience_match: number;
  skills_match: number;
  keywords_found: string[];
  keywords_missing: string[];
  keywords_partial: string[];
  tips: string[];
}

export type InputMode = "paste" | "upload";

export interface FileState {
  fileName: string;
  status: "idle" | "parsing" | "success" | "error";
  errorMessage?: string;
}
