import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Clipboard, UploadCloud, CheckCircle2, AlertCircle, 
  HelpCircle, ChevronRight, Heart, HeartHandshake, ShieldCheck, Sparkles 
} from "lucide-react";
import { ATSAnalysisResult, FileState, InputMode } from "./types";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { TOP_QUOTES } from "./data/quotes";
import { analyzeResumeClientSide } from "./utils/atsEngine";

// Declare library globals on the browser window
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

const LOADING_STEPS = [
  "Scanning resume text for core technologies...",
  "Parsing key terms and requirements from the JD...",
  "Testing structure & segment headings for standard compliance...",
  "Evaluating years of experience alignment...",
  "Mapping candidate skills against preferred qualifications...",
  "Assembling final ATS feedback analytics..."
];

export default function App() {
  // Input fields
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");

  // Input states (paste or file-upload)
  const [resumeMode, setResumeMode] = useState<InputMode>("paste");
  const [jdMode, setJdMode] = useState<InputMode>("paste");

  // File objects
  const [resumeFile, setResumeFile] = useState<FileState>({ fileName: "", status: "idle" });
  const [jdFile, setJdFile] = useState<FileState>({ fileName: "", status: "idle" });

  // Processing indicators
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);

  // Decorative quotes
  const [quoteIdx, setQuoteIdx] = useState(0);

  // References for drag and active panels
  const [resumeDrag, setResumeDrag] = useState(false);
  const [jdDrag, setJdDrag] = useState(false);

  useEffect(() => {
    // Pick a random positive quote on load
    setQuoteIdx(Math.floor(Math.random() * TOP_QUOTES.length));
  }, []);

  // Set up interval for scanning state reassurance text
  useEffect(() => {
    let tInterval: any;
    if (loading) {
      let idx = 0;
      setLoadingText(LOADING_STEPS[0]);
      tInterval = setInterval(() => {
        idx = (idx + 1) % LOADING_STEPS.length;
        setLoadingText(LOADING_STEPS[idx]);
      }, 2000);
    }
    return () => {
      if (tInterval) clearInterval(tInterval);
    };
  }, [loading]);

  // Client-Side parsing of PDF and Word files
  const handleFileProcess = async (file: File, type: "resume" | "jd") => {
    const name = file.name;
    const updateState = (state: Partial<FileState>) => {
      if (type === "resume") {
        setResumeFile(prev => ({ ...prev, ...state }));
      } else {
        setJdFile(prev => ({ ...prev, ...state }));
      }
    };

    updateState({ fileName: name, status: "parsing", errorMessage: "" });

    try {
      const ext = name.split(".").pop()?.toLowerCase();
      let text = "";

      if (ext === "pdf") {
        if (!window.pdfjsLib) {
          throw new Error("The PDF processing script is loading. Please paste the text directly or retry in 3 seconds.");
        }
        // Set standard pdfJS worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let collected = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const rawContent = await page.getTextContent();
          collected += rawContent.items.map((item: any) => item.str).join(" ") + "\r\n";
        }
        text = collected.trim();
      } else if (ext === "docx") {
        if (!window.mammoth) {
          throw new Error("The DOCX processing script is loading. Please paste the text directly or retry in 3 seconds.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const res = await window.mammoth.extractRawText({ arrayBuffer });
        text = res.value.trim();
      } else {
        throw new Error("Only .pdf and .docx files are accepted on this parser.");
      }

      if (!text) {
        throw new Error("Could not extract any standard text from this file. Is it empty or scanned as an image?");
      }

      // Update text input & successfully complete parsing phase
      if (type === "resume") {
        setResumeText(text);
        setResumeMode("paste"); // Force mode toggle so they can inspect extract text
      } else {
        setJdText(text);
        setJdMode("paste");
      }
      updateState({ status: "success" });
    } catch (err: any) {
      console.error(err);
      updateState({ status: "error", errorMessage: err.message || "Decoding file failed." });
    }
  };

  const handleAuditAction = async () => {
    setErrorMsg("");
    setAnalysisResult(null);

    const checkResume = resumeText.trim();
    const checkJd = jdText.trim();

    if (!checkResume) {
      setErrorMsg("Please add your resume (by pasting text or importing a PDF/DOCX file) first.");
      return;
    }
    if (!checkJd) {
      setErrorMsg("Please add the target Job Description to accurately calculate your score.");
      return;
    }

    setLoading(true);

    try {
      // Simulate real-time progress steps for a highly polished experience
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = analyzeResumeClientSide(checkResume, checkJd);
      setAnalysisResult(result);
      
      // Ensure visual scroll to the compiled results
      setTimeout(() => {
         const el = document.getElementById("results-section");
         if (el) {
           el.scrollIntoView({ behavior: "smooth" });
         }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze. Please verify your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-overlay min-h-screen relative pb-16 text-main-text font-sans selection:bg-main-accent/30 selection:text-main-accent">
      
      {/* High Density Navigation */}
      <nav className="h-14 border-b border-main-border flex items-center justify-between px-4 md:px-6 bg-main-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-main-accent rounded flex items-center justify-center text-main-bg font-mono font-extrabold text-xs shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            A
          </div>
          <span className="font-sans text-xs tracking-wider text-main-text font-bold">
            Resume ATS Auditor
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[9px] text-main-muted uppercase leading-none">Security Status</span>
            <span className="text-[11px] text-main-accent font-mono font-medium">100% Secure & Private</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-main-border"></div>
          <button 
            onClick={handleAuditAction}
            className="bg-main-accent hover:bg-main-accent/90 text-main-bg text-xs px-3.5 py-1.5 rounded font-bold tracking-wider font-mono uppercase transition-colors"
          >
            Scan Resume
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-6">
        
        {/* Header Block */}
        <header className="text-center space-y-3.5 py-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-main-accent/10 border border-main-accent/30 rounded text-[9px] font-mono uppercase tracking-widest text-main-accent animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Free ATS Auditor — No Limits
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-main-text select-text">
            Resume <span className="text-main-accent">ATS</span> Auditor
          </h1>
          
          <p className="max-w-xl mx-auto text-xs md:text-sm font-mono text-main-muted leading-relaxed">
            Audit your candidacy documents against preferred job descriptions to calculate structural score, identify key skill omissions, and optimize keyword alignment.
          </p>

          <div className="flex justify-center items-center gap-2 flex-wrap">
            <span className="inline-block text-[10px] font-mono font-semibold tracking-wider bg-main-surface border border-main-border py-1 px-3 rounded text-main-accent">
              ✦ NO SIGNUP REQUIRED — 100% PRIVATE ✦
            </span>
            <span className="inline-block text-[10px] font-mono tracking-wider bg-main-surface border border-main-border py-1 px-3 rounded text-main-accent2">
              ✦ SECURE LOCAL CACHING ✦
            </span>
          </div>
        </header>

        {/* Motivational Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-main-surface border border-main-border rounded p-4 text-center relative overflow-hidden flex flex-col items-center justify-center"
        >
          {/* Subtle Quotes */}
          <p className="text-xs italic text-main-text tracking-wide leading-relaxed pl-6 relative">
            <span className="absolute left-0 top-0 text-3xl font-mono text-main-accent/20 leading-none">“</span>
            {TOP_QUOTES[quoteIdx]}
          </p>
          <span className="block mt-2 font-mono text-[9px] tracking-widest uppercase text-main-accent">
            — KEEP BELIEVING. KEEP GROWING. ✨
          </span>
        </motion.div>

        {/* Input Control Boards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* RESUME INPUT CONTROL */}
          <div className="bg-main-surface border border-main-border rounded p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-main-accent flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-main-accent animate-pulse" />
                Resume Document Stream
              </span>
            </div>

            {/* Input Toggle */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setResumeMode("paste")}
                className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all border ${
                  resumeMode === "paste"
                    ? "bg-main-accent/10 border-main-accent/40 text-main-accent font-bold"
                    : "bg-main-surface2/50 border-main-border text-main-muted hover:text-main-text"
                }`}
              >
                <Clipboard className="w-3 h-3" />
                Raw Text Paste
              </button>
              <button
                onClick={() => setResumeMode("upload")}
                className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all border ${
                  resumeMode === "upload"
                    ? "bg-main-accent/10 border-main-accent/40 text-main-accent font-bold"
                    : "bg-main-surface2/50 border-main-border text-main-muted hover:text-main-text"
                }`}
              >
                <FileText className="w-3 h-3" />
                Upload File (.pdf/.docx)
              </button>
            </div>

            {/* Panel Area */}
            {resumeMode === "paste" ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full plain text of your resume here... Include sections such as objective, work experience, standard tools, skills, and certifications so the scanner can locate them."
                className="w-full min-h-[180px] max-h-[300px] flex-1 bg-main-surface2 border border-main-border rounded p-3 text-xs font-mono font-medium leading-relaxed outline-none focus:border-main-accent focus:ring-1 focus:ring-main-accent/5 transition-colors placeholder:text-main-muted/50 resize-y"
              />
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setResumeDrag(true);
                }}
                onDragLeave={() => setResumeDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setResumeDrag(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileProcess(file, "resume");
                }}
                className={`border border-dashed rounded p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] flex-1 transition-all ${
                  resumeDrag 
                    ? "border-main-accent bg-main-accent/5" 
                    : "border-main-border bg-main-surface2/30 hover:border-main-accent/40"
                }`}
                onClick={() => document.getElementById("resume-file-picker")?.click()}
              >
                <UploadCloud className="w-8 h-8 text-main-muted mb-2" />
                <p className="text-[11px] font-mono font-bold text-main-text uppercase tracking-wider">
                  Drag & Drop Resume
                </p>
                <p className="text-[9px] font-mono text-main-muted mt-1 leading-normal">
                  or <span className="text-main-accent underline">browse filesystem</span>
                  <br />
                  PDF / Word (.docx) formats
                </p>
                <input
                  id="resume-file-picker"
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file, "resume");
                  }}
                />

                {/* File Upload Process Status indicator */}
                {resumeFile.status !== "idle" && (
                  <div className="mt-3 p-2 bg-main-surface border border-main-border rounded text-left text-[10px] font-mono max-w-full overflow-hidden">
                    {resumeFile.status === "parsing" && (
                      <span className="text-main-accent flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-main-accent" />
                        Scanning content stream...
                      </span>
                    )}
                    {resumeFile.status === "success" && (
                      <span className="text-main-accent flex items-center gap-1.5 font-bold">
                        ✓ Loaded: {resumeFile.fileName}
                      </span>
                    )}
                    {resumeFile.status === "error" && (
                      <span className="text-main-danger flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{resumeFile.errorMessage}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* JOB DESCRIPTION INPUT CONTROL */}
          <div className="bg-main-surface border border-main-border rounded p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-main-accent2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-main-accent2" />
                Target Job Description
              </span>
            </div>

            {/* Input Toggle */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setJdMode("paste")}
                className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all border ${
                  jdMode === "paste"
                    ? "bg-main-accent2/10 border-main-accent2/40 text-main-accent2 font-bold"
                    : "bg-main-surface2/50 border-main-border text-main-muted hover:text-main-text"
                }`}
              >
                <Clipboard className="w-3 h-3" />
                Raw Text Paste
              </button>
              <button
                onClick={() => setJdMode("upload")}
                className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all border ${
                  jdMode === "upload"
                    ? "bg-main-accent2/10 border-main-accent2/40 text-main-accent2 font-bold"
                    : "bg-main-surface2/50 border-main-border text-main-muted hover:text-main-text"
                }`}
              >
                <FileText className="w-3 h-3" />
                Upload File (.pdf/.docx)
              </button>
            </div>

            {/* Panel Area */}
            {jdMode === "paste" ? (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job listing details or description here... Make sure to include core responsibilities, tool frameworks requested, certifications, and structural needs."
                className="w-full min-h-[180px] max-h-[300px] flex-1 bg-main-surface2 border border-main-border rounded p-3 text-xs font-mono font-medium leading-relaxed outline-none focus:border-main-accent2 focus:ring-1 focus:ring-main-accent2/5 transition-colors placeholder:text-main-muted/50 resize-y"
              />
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setJdDrag(true);
                }}
                onDragLeave={() => setJdDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setJdDrag(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileProcess(file, "jd");
                }}
                className={`border border-dashed rounded p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] flex-1 transition-all ${
                  jdDrag 
                    ? "border-main-accent2 bg-main-accent2/5" 
                    : "border-main-border bg-main-surface2/30 hover:border-main-accent2/40"
                }`}
                onClick={() => document.getElementById("jd-file-picker")?.click()}
              >
                <UploadCloud className="w-8 h-8 text-main-muted mb-2" />
                <p className="text-[11px] font-mono font-bold text-main-text uppercase tracking-wider">
                  Drag & Drop Specifications
                </p>
                <p className="text-[9px] font-mono text-main-muted mt-1 leading-normal">
                  or <span className="text-main-accent2 underline">browse filesystem</span>
                  <br />
                  PDF / Word (.docx) formats
                </p>
                <input
                  id="jd-file-picker"
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file, "jd");
                  }}
                />

                {/* File Upload Process Status indicator */}
                {jdFile.status !== "idle" && (
                  <div className="mt-3 p-2 bg-main-surface border border-main-border rounded text-left text-[10px] font-mono max-w-full overflow-hidden">
                    {jdFile.status === "parsing" && (
                      <span className="text-main-accent2 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-main-accent2" />
                        Scanning content stream...
                      </span>
                    )}
                    {jdFile.status === "success" && (
                      <span className="text-main-accent2 flex items-center gap-1.5 font-bold">
                        ✓ Loaded: {jdFile.fileName}
                      </span>
                    )}
                    {jdFile.status === "error" && (
                      <span className="text-main-danger flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{jdFile.errorMessage}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert Panel */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-4 bg-main-danger/10 border border-main-danger/30 rounded-xl text-main-danger text-xs font-mono select-text"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block mb-1">Execution Interrupted:</span>
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}

        {/* Primary Audit Action Trigger */}
        <button
          onClick={handleAuditAction}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-main-accent text-main-bg font-extrabold tracking-wider font-sans text-sm rounded-xl cursor-pointer hover:shadow-[0_0_24px_rgba(0,255,135,0.4)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-main-bg border-t-transparent animate-spin inline-block" />
              Processing Audit...
            </div>
          ) : (
            <>
              ⚡ ANALYZE MY ATS SCORE — FREE
            </>
          )}
        </button>

        {/* Dynamic Scanning Spinner Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-main-surface border border-main-border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full border-4 border-main-border border-t-main-accent animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-mono font-bold text-main-accent tracking-wide animate-pulse">
                ATS Engine Working...
              </p>
              <p className="text-xs font-mono text-main-muted max-w-sm">
                {loadingText}
              </p>
            </div>
          </motion.div>
        )}

        {/* Display Analysis Results Section */}
        {analysisResult && (
          <ResultsDisplay result={analysisResult} />
        )}

        {/* Beautiful Pay-It-Forward Donation widget */}
        <div className="bg-gradient-to-br from-main-surface to-main-surface border border-main-border rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none pointer-events-none">
            <HeartHandshake className="w-48 h-48" />
          </div>

          <div className="text-center md:text-left space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-main-warn font-mono uppercase tracking-widest text-[10px] font-bold">
              <Heart className="w-3.5 h-3.5 text-main-danger fill-main-danger" />
              Pay It Forward — 100% Voluntary Charity Advocacy
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              This intelligence engine costs nothing to use.
            </h2>
          </div>

          <p className="text-xs md:text-sm text-main-muted font-mono leading-relaxed max-w-3xl">
            This workspace counts cost as secondary, committing to completely free diagnostics. If this engine assisted in improving your score, securing an interview alignment, or polishing your professional brand, <strong>please pay the energy forward to children in need.</strong>
            <br /><br />
            No donation goes through our systems. Your support goes directly to vetted humanitarian platforms advocating for sustenance, nutritional equity, and foundational children's rights. Even a tiny donation can establish a beautiful educational outcome. Please consider supporting below.
          </p>

          <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
            {[
              { label: "🌍 UNICEF Action", link: "https://www.unicef.org/india/donate" },
              { label: "❤️ CRY — Child Rights", link: "https://www.cry.org" },
              { label: "🍱 Akshaya Patra", link: "https://www.akshayapatra.org/donate" },
              { label: "💚 Ketto Foundations", link: "https://www.ketto.org" }
            ].map((donor, idx) => (
              <a
                key={idx}
                href={donor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 bg-main-surface2 hover:bg-main-surface hover:text-main-accent border border-main-border hover:border-main-accent/45 text-xs font-mono font-bold tracking-tight rounded-xl transition-all"
              >
                {donor.label}
              </a>
            ))}
          </div>

          <div className="p-4 bg-main-surface2 border border-main-border rounded-xl space-y-1">
            <p className="text-xs font-mono font-bold text-main-text">
              ✨ Remember, you are capable and doing wonderfully.
            </p>
            <p className="text-[11px] font-mono text-main-muted leading-relaxed">
              Applying for matches is demanding, but persistence will reveal perfect placements. Enjoy your progression, do not stress unnecessarily, and maintain your momentum. Things fall into place beautifully with time.
            </p>
          </div>
        </div>

        {/* Design signature footer */}
        <footer className="text-center font-mono text-[10px] text-main-muted tracking-widest leading-loose pt-4">
          DESIGNED & DEVELOPED BY <span className="text-main-accent">BHAVESH SHARMA</span> ✨
          <br />
          ATS INTELLIGENCE RUNTIME — 100% SECURE & PRIVATE
        </footer>

      </div>
    </div>
  );
}
