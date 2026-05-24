import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, XCircle, ArrowRight, Sparkles, Award, FileText, Check, ListChecks } from "lucide-react";
import { ATSAnalysisResult } from "../types";
import { RESULT_QUOTES } from "../data/quotes";

interface ResultsDisplayProps {
  result: ATSAnalysisResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    const idx = Math.floor(Math.random() * RESULT_QUOTES.length);
    setRandomQuote(RESULT_QUOTES[idx]);
  }, [result]);

  const {
    score = 0,
    grade = "Fair",
    summary = "",
    keyword_match_pct = 0,
    format_score = 0,
    experience_match = 0,
    skills_match = 0,
    keywords_found = [],
    keywords_missing = [],
    keywords_partial = [],
    tips = []
  } = result;

  // Gauge circular ring parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Dynamic colors based on score tiers
  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-main-accent";
    if (val >= 60) return "text-main-warn";
    return "text-main-danger";
  };

  const getScoreBorderColor = (val: number) => {
    if (val >= 80) return "stroke-main-accent";
    if (val >= 60) return "stroke-main-warn";
    return "stroke-main-danger";
  };

  const getPercentageColorClass = (val: number) => {
    if (val >= 80) return "text-main-accent bg-main-accent/10 border-main-accent/20";
    if (val >= 60) return "text-main-warn bg-main-warn/10 border-main-warn/20";
    return "text-main-danger bg-main-danger/10 border-main-danger/20";
  };

  const getPercentageBarClass = (val: number) => {
    if (val >= 80) return "bg-main-accent";
    if (val >= 60) return "bg-main-warn";
    return "bg-main-danger";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="results-section"
      className="space-y-6 scroll-mt-20"
    >
      {/* Score Hero Section */}
      <div className="bg-main-surface border border-main-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-32 -top-32 w-64 h-64 bg-main-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-main-accent2/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Circular Gauge Ring */}
        <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Ring */}
            <circle
              className="text-main-surface2 stroke-current"
              strokeWidth="8"
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
            />
            {/* Animated Target Ring */}
            <motion.circle
              className={`${getScoreBorderColor(score)} stroke-current`}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-mono font-bold tracking-tight ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-main-muted">
              / 100 Score
            </span>
          </div>
        </div>

        {/* Audit Details */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3  rounded-full border border-main-border bg-main-surface2 text-xs font-mono tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-main-accent animate-pulse" />
            <span className={getScoreColor(score)}>{grade} Match</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            ATS Compatibility Rating
          </h2>
          <p className="text-sm font-mono text-main-muted leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Inspirational Career Quote Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-main-accent2/5 to-main-accent/5 border border-main-accent2/20 rounded-2xl p-5 text-center relative overflow-hidden"
      >
        <span className="absolute -left-1 -top-3 text-7xl font-sans opacity-10 text-main-accent select-none pointer-events-none">
          “
        </span>
        <p className="text-sm italic text-main-text leading-relaxed font-sans max-w-2xl mx-auto px-4">
          &ldquo;{randomQuote}&rdquo;
        </p>
        <span className="block mt-2 font-mono text-[10px] uppercase tracking-widest text-main-accent2">
          — You exceed your numbers. Do not stop. 🌟
        </span>
      </motion.div>

      {/* Grid of Key Match Parameters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Keywords Found", val: keyword_match_pct, suffix: "%" },
          { label: "ATS Formatting", val: format_score, suffix: "/100" },
          { label: "Experience Mapping", val: experience_match, suffix: "/100" },
          { label: "Technical Skills", val: skills_match, suffix: "%" },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
            className="bg-main-surface border border-main-border rounded-xl p-4 flex flex-col justify-between"
          >
            <div className={`text-2xl font-mono font-bold ${getScoreColor(metric.val)}`}>
              {metric.val}{metric.suffix}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-main-muted mt-2">
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Match Details & Keywords Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Progress Bars Section */}
        <div className="bg-main-surface border border-main-border rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-main-accent flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-main-accent shadow-[0_0_8px_rgba(0,255,135,0.8)]" />
            Rating Breakdown
          </h3>

          <div className="space-y-4">
            {[
              { label: "Keyword Density Match", val: keyword_match_pct },
              { label: "ATS Standard Structure & Formatting", val: format_score },
              { label: "Experience Level Alignment", val: experience_match },
              { label: "Skills Alignment", val: skills_match }
            ].map((bar, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-main-muted">
                  <span>{bar.label}</span>
                  <span className={getScoreColor(bar.val)}>{bar.val}%</span>
                </div>
                <div className="h-2 w-full bg-main-surface2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getPercentageBarClass(bar.val)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.val}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions / Strategy Checklist */}
        <div className="bg-main-surface border border-main-border rounded-2xl p-6">
          <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-main-warn flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-main-warn shadow-[0_0_8px_rgba(255,184,48,0.8)]" />
            Optimization Priority Check
          </h3>

          <ul className="space-y-3.5">
            {tips.map((tip, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx + 0.5 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-main-accent" />
                </div>
                <p className="text-xs font-mono text-main-muted leading-relaxed select-text">
                  {tip}
                </p>
              </motion.li>
            ))}
            {tips.length === 0 && (
              <li className="text-xs font-mono text-main-muted text-center py-4">No suggestions generated. Your format looks excellent!</li>
            )}
          </ul>
        </div>
      </div>

      {/* Keywords Matrices */}
      <div className="space-y-4">
        {/* Found Keywords */}
        {keywords_found.length > 0 && (
          <div className="bg-main-surface border border-main-border rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase text-main-accent flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-main-accent shadow-[0_0_6px_rgba(0,255,135,0.8)]" />
              Keywords Detected Accurately ({keywords_found.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords_found.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-mono bg-main-accent/10 border border-main-accent/20 text-main-accent rounded-lg"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {keywords_missing.length > 0 && (
          <div className="bg-main-surface border border-main-border rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase text-main-danger flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-main-danger shadow-[0_0_6px_rgba(255,77,109,0.8)]" />
              Critical Keywords Missing ({keywords_missing.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords_missing.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-mono bg-main-danger/10 border border-main-danger/20 text-main-danger rounded-lg"
                >
                  ✗ {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Synonyms / Partial Matches */}
        {keywords_partial.length > 0 && (
          <div className="bg-main-surface border border-main-border rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase text-main-warn flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-main-warn shadow-[0_0_6px_rgba(255,184,48,0.8)]" />
              Near Matches & Related Synonyms ({keywords_partial.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords_partial.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-mono bg-main-warn/10 border border-main-warn/20 text-main-warn rounded-lg"
                >
                  ~ {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
