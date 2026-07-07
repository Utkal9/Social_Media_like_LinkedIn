import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSelector } from "react-redux";
import clientServer from "@/config";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import {
    ArrowLeft,
    Sparkles,
    Target,
    BarChart3,
    BrainCircuit,
    Rocket,
    FileText,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Lightbulb,
    ShieldCheck,
    Zap,
    Search,
    Mic2,
} from "lucide-react";
import { diffWords } from "diff";
import styles from "./index.module.css";

// ===== Score Circle Component =====
const ScoreCircle = ({ score, color }) => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className={styles.scoreCircle}>
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle className={styles.scoreBg} cx="70" cy="70" r={radius} />
                <circle
                    className={styles.scoreFill}
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className={styles.scoreValue}>
                <span className={styles.scoreNumber} style={{ color }}>
                    {score}
                </span>
                <span className={styles.scoreLabel}>Match</span>
            </div>
        </div>
    );
};

// ===== Question Card Component =====
const QuestionCard = ({ q, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    const typeBadge = {
        technical: styles.badgeTechnical,
        behavioral: styles.badgeBehavioral,
        situational: styles.badgeSituational,
    };
    const diffBadge = {
        easy: styles.badgeEasy,
        medium: styles.badgeMedium,
        hard: styles.badgeHard,
    };

    return (
        <div className={styles.questionCard}>
            <div className={styles.questionHeader} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.questionNumber}>{index + 1}</div>
                <div className={styles.questionText}>{q.question}</div>
                <div className={styles.questionMeta}>
                    <span className={`${styles.badge} ${typeBadge[q.type] || styles.badgeTechnical}`}>
                        {q.type}
                    </span>
                    <span className={`${styles.badge} ${diffBadge[q.difficulty] || styles.badgeMedium}`}>
                        {q.difficulty}
                    </span>
                </div>
                <ChevronDown
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                    size={18}
                />
            </div>
            {isOpen && (
                <div className={styles.questionBody}>
                    <div className={styles.hintBox}>
                        <div className={styles.hintLabel}>💡 How to answer</div>
                        <p className={styles.hintText}>{q.hint}</p>
                    </div>
                    <div className={styles.checkBox}>
                        <div className={styles.checkLabel}>🎯 What they check</div>
                        <p className={styles.checkText}>{q.what_they_check}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== Main Page =====
const AIToolsPage = () => {
    const router = useRouter();
    const { token: authReduxToken } = useSelector((state) => state.auth);
    const getToken = () => authReduxToken || localStorage.getItem("token");

    // --- State ---
    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [activeTab, setActiveTab] = useState("match"); // match | tailor | interview

    // Results state per tab
    const [matchResult, setMatchResult] = useState(null);
    const [tailorResult, setTailorResult] = useState(null);
    const [interviewResult, setInterviewResult] = useState(null);

    // Loading / error per tab
    const [loadingTab, setLoadingTab] = useState(null); // which tab is loading
    const [error, setError] = useState(null);

    // --- Load resumes on mount ---
    useEffect(() => {
        const loadResumes = async () => {
            try {
                const token = getToken();
                const { data } = await clientServer.get("/resume/all", { params: { token } });
                setResumes(data.resumes || []);
                if (data.resumes?.length > 0) {
                    setSelectedResumeId(data.resumes[0]._id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadResumes();
    }, []);

    // --- Pre-fill from query params (e.g. coming from resume builder) ---
    useEffect(() => {
        if (router.query.resumeId) {
            setSelectedResumeId(router.query.resumeId);
        }
    }, [router.query]);

    // --- Score color ---
    const getScoreColor = (score) => {
        if (score >= 80) return "#0fffc6";
        if (score >= 60) return "#f59e0b";
        if (score >= 40) return "#f97316";
        return "#ef4444";
    };

    // --- API calls ---
    const runAnalysis = async (tab) => {
        if (!selectedResumeId || !jobDescription.trim()) return;

        setLoadingTab(tab);
        setError(null);
        setActiveTab(tab);

        const token = getToken();
        const payload = { token, resumeId: selectedResumeId, jobDescription };

        try {
            if (tab === "match") {
                const { data } = await clientServer.post("/resume/ai/match-score", payload);
                setMatchResult(data.analysis);
            } else if (tab === "tailor") {
                const { data } = await clientServer.post("/resume/ai/tailor", payload);
                setTailorResult(data);
            } else if (tab === "interview") {
                const { data } = await clientServer.post("/resume/ai/mock-interview", payload);
                setInterviewResult(data.questions);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Something went wrong.");
        } finally {
            setLoadingTab(null);
        }
    };

    const canAnalyze = selectedResumeId && jobDescription.trim().length > 20;

    // --- Render helpers ---
    const renderEmptyState = () => (
        <div className={styles.emptyState}>
            <Search className={styles.emptyIcon} size={56} />
            <h3 className={styles.emptyTitle}>Paste a Job Description to Begin</h3>
            <p className={styles.emptySubtitle}>
                Select your resume, paste any job description from Naukri, LinkedIn, or any job portal,
                and click &quot;Analyze&quot; to get AI-powered insights.
            </p>
        </div>
    );

    const renderLoading = (text) => (
        <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>{text}</p>
        </div>
    );

    const renderError = () => (
        <div className={styles.errorState}>
            <AlertCircle className={styles.errorIcon} size={40} />
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={() => runAnalysis(activeTab)}>
                Try Again
            </button>
        </div>
    );

    // --- Tab: Match Score ---
    const renderMatchTab = () => {
        if (loadingTab === "match") return renderLoading("Analyzing your resume against the JD...");
        if (error && activeTab === "match") return renderError();
        if (!matchResult) return renderEmptyState();

        const m = matchResult;
        const scoreColor = getScoreColor(m.score);
        const atsColor = getScoreColor(m.ats_score);

        return (
            <div className={styles.scoreSection}>
                {/* Score + Summary */}
                <div className={styles.scoreHeader}>
                    <ScoreCircle score={m.score} color={scoreColor} />
                    <div className={styles.scoreSummary}>
                        <p>{m.summary}</p>
                    </div>
                </div>

                {/* ATS Bar */}
                <div className={styles.atsBar}>
                    <span className={styles.atsLabel}>ATS Score</span>
                    <div className={styles.atsTrack}>
                        <div
                            className={styles.atsFill}
                            style={{ width: `${m.ats_score}%`, backgroundColor: atsColor }}
                        />
                    </div>
                    <span className={styles.atsScore} style={{ color: atsColor }}>
                        {m.ats_score}%
                    </span>
                </div>

                {/* Skills Columns */}
                <div className={styles.skillColumns}>
                    <div className={styles.skillColumn}>
                        <div className={styles.skillColumnTitle} style={{ color: "var(--neon-teal)" }}>
                            <CheckCircle2 size={14} /> Matching Skills
                        </div>
                        <div className={styles.skillTags}>
                            {m.matching_skills?.map((s, i) => (
                                <span key={i} className={`${styles.skillTag} ${styles.skillTagMatch}`}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.skillColumn}>
                        <div className={styles.skillColumnTitle} style={{ color: "var(--neon-pink)" }}>
                            <AlertCircle size={14} /> Missing Skills
                        </div>
                        <div className={styles.skillTags}>
                            {m.missing_skills?.map((s, i) => (
                                <span key={i} className={`${styles.skillTag} ${styles.skillTagMissing}`}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Keyword Gaps */}
                {m.keyword_gaps?.length > 0 && (
                    <div className={styles.skillColumn}>
                        <div className={styles.skillColumnTitle} style={{ color: "var(--neon-blue)" }}>
                            <Search size={14} /> Keyword Gaps
                        </div>
                        <div className={styles.skillTags}>
                            {m.keyword_gaps.map((s, i) => (
                                <span key={i} className={`${styles.skillTag} ${styles.skillTagKeyword}`}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions + ATS Tips */}
                <div className={styles.suggestionsSection}>
                    <div className={styles.suggestionBox}>
                        <div className={styles.suggestionTitle}>
                            <Lightbulb size={14} style={{ color: "var(--neon-violet)" }} /> Improvement
                            Suggestions
                        </div>
                        <ul className={styles.suggestionList}>
                            {m.suggestions?.map((s, i) => (
                                <li key={i} className={styles.suggestionItem}>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.suggestionBox}>
                        <div className={styles.suggestionTitle}>
                            <ShieldCheck size={14} style={{ color: "var(--neon-teal)" }} /> ATS Tips
                        </div>
                        <ul className={styles.suggestionList}>
                            {m.ats_tips?.map((s, i) => (
                                <li key={i} className={styles.suggestionItem}>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    // --- Diff Helper ---
    const renderDiff = (oldText, newText) => {
        if (!oldText || !newText) return null;
        const diff = diffWords(oldText, newText);
        return (
            <div className={styles.diffContainer}>
                {diff.map((part, index) => {
                    const color = part.added ? '#00ffaa' : part.removed ? '#ff4d4d' : 'inherit';
                    const textDecoration = part.removed ? 'line-through' : 'none';
                    const backgroundColor = part.added ? 'rgba(0, 255, 170, 0.1)' : part.removed ? 'rgba(255, 77, 77, 0.1)' : 'transparent';
                    
                    return (
                        <span key={index} style={{ color, textDecoration, backgroundColor, padding: '0 2px', borderRadius: '3px' }}>
                            {part.value}
                        </span>
                    );
                })}
            </div>
        );
    };

    // --- Tab: Tailor Resume ---
    const renderTailorTab = () => {
        if (loadingTab === "tailor")
            return renderLoading("AI is tailoring your resume for this JD...");
        if (error && activeTab === "tailor") return renderError();
        if (!tailorResult) {
            return (
                <div className={styles.emptyState}>
                    <Target className={styles.emptyIcon} size={56} />
                    <h3 className={styles.emptyTitle}>Tailor Your Resume</h3>
                    <p className={styles.emptySubtitle}>
                        AI will rewrite your resume&apos;s summary, experience, and projects to match the
                        job description — optimized for ATS shortlisting. Your original resume stays
                        untouched.
                    </p>
                    <button
                        className={styles.analyzeBtn}
                        style={{ maxWidth: 280 }}
                        onClick={() => runAnalysis("tailor")}
                        disabled={!canAnalyze || loadingTab}
                    >
                        <Zap size={18} /> Tailor My Resume
                    </button>
                </div>
            );
        }

        return (
            <div className={styles.tailorSuccess}>
                <div className={styles.tailorSuccessIcon}>
                    <CheckCircle2 size={36} />
                </div>
                <h3 className={styles.tailorSuccessTitle}>Resume Tailored Successfully!</h3>
                <p className={styles.tailorSuccessSubtitle}>
                    A new resume &quot;Tailored — {tailorResult.roleName}&quot; has been created in your
                    dashboard. Your original resume is untouched.
                </p>

                {tailorResult.diffData && (
                    <div className={styles.diffBox}>
                        <h4>Professional Summary Changes</h4>
                        <div className={styles.diffContent}>
                            {renderDiff(tailorResult.diffData.oldSummary, tailorResult.diffData.newSummary)}
                        </div>
                    </div>
                )}

                <div className={styles.tailorBtnGroup}>
                    <button
                        className={styles.tailorViewBtn}
                        onClick={() => router.push(`/resume-builder/${tailorResult.resumeId}`)}
                    >
                        View Tailored Resume →
                    </button>
                    <button
                        className={styles.tailorSecondaryBtn}
                        onClick={() => {
                            setTailorResult(null);
                        }}
                    >
                        Tailor Again
                    </button>
                </div>
            </div>
        );
    };

    // --- Tab: Mock Interview ---
    const renderInterviewTab = () => {
        if (loadingTab === "interview")
            return renderLoading("Generating personalized interview questions...");
        if (error && activeTab === "interview") return renderError();
        if (!interviewResult) return renderEmptyState();

        return (
            <div className={styles.interviewSection}>
                {interviewResult.map((q, i) => (
                    <QuestionCard key={i} q={q} index={i} />
                ))}
            </div>
        );
    };

    const tabs = [
        { id: "match", label: "Match Score", icon: BarChart3 },
        { id: "tailor", label: "Tailor Resume", icon: Target },
        { id: "interview", label: "Mock Interview", icon: BrainCircuit },
    ];

    return (
        <div className={styles.container} style={{ backgroundColor: "var(--holo-bg)" }}>
            <div className={styles.inner}>
                {/* Back Link */}
                <Link href="/resume-builder" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Resume Dashboard
                </Link>

                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <Sparkles size={28} style={{ color: "var(--neon-violet)" }} />
                    <h1 className={styles.pageTitle}>AI Career Tools</h1>
                </div>
                <p className={styles.pageSubtitle}>
                    Paste any job description — get AI-powered resume analysis, tailoring, and interview prep.
                </p>

                {/* ── AI FEATURE ENTRY CARDS ── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}>
                    {/* AI Voice Interview Card */}
                    <div
                        id="live-ai-interview-card"
                        onClick={() => router.push("/live-interview")}
                        style={{
                            cursor: "pointer",
                            background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.9) 100%)",
                            border: "1px solid rgba(99,102,241,0.35)",
                            borderRadius: "1rem",
                            padding: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            boxShadow: "0 0 30px rgba(99,102,241,0.08)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(99,102,241,0.25)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(99,102,241,0.08)"; }}
                    >
                        <div style={{
                            width: 52, height: 52,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #6366f1, #0f172a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                        }}>
                            <Mic2 size={24} color="#c7d2fe" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1rem", marginBottom: 4 }}>
                                Live AI Interview
                                <span style={{ marginLeft: 8, fontSize: "0.65rem", background: "rgba(99,102,241,0.2)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}>NEW</span>
                            </div>
                            <div style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5 }}>
                                1-on-1 with Priya, your AI HR recruiter. Real voice, photorealistic avatar, adaptive questions.
                            </div>
                        </div>
                    </div>

                    {/* Market Skill Insights Card */}
                    <div
                        id="market-skill-insights-card"
                        onClick={() => router.push("/skills")}
                        style={{
                            cursor: "pointer",
                            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(15,23,42,0.9) 100%)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            borderRadius: "1rem",
                            padding: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            boxShadow: "0 0 30px rgba(16,185,129,0.05)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(16,185,129,0.2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.05)"; }}
                    >
                        <div style={{
                            width: 52, height: 52,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #10b981, #0f172a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 0 20px rgba(16,185,129,0.4)",
                        }}>
                            <BarChart3 size={24} color="#6ee7b7" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1rem", marginBottom: 4 }}>
                                Skill Gap Insights
                                <span style={{ marginLeft: 8, fontSize: "0.65rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}>LIVE</span>
                            </div>
                            <div style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5 }}>
                                See what skills are trending in the job market and find your personal skill gaps.
                            </div>
                        </div>
                    </div>
                </div>

                {/* No resumes guard */}
                {resumes.length === 0 ? (
                    <div className={styles.inputPanel}>
                        <div className={styles.noResumesHint}>
                            <FileText size={40} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: 12 }} />
                            <p>You don&apos;t have any resumes yet.</p>
                            <p>
                                <Link href="/resume-builder" className={styles.noResumesLink}>
                                    Create your first resume
                                </Link>{" "}
                                to use AI Career Tools.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Input Panel */}
                        <div className={styles.inputPanel}>
                            <div className={styles.inputGrid}>
                                {/* JD Textarea */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Job Description</label>
                                    <textarea
                                        className={styles.jdTextarea}
                                        placeholder="Paste the full job description here... (from Naukri, LinkedIn, company website, etc.)"
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>

                                {/* Side: Resume Select + Analyze Button */}
                                <div className={styles.sideInputs}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Select Resume</label>
                                        <select
                                            className={styles.resumeSelect}
                                            value={selectedResumeId}
                                            onChange={(e) => setSelectedResumeId(e.target.value)}
                                        >
                                            {resumes.map((r) => (
                                                <option key={r._id} value={r._id}>
                                                    {r.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        className={styles.analyzeBtn}
                                        disabled={!canAnalyze || loadingTab}
                                        onClick={() => {
                                            // Run match + interview in parallel, tailor is manual
                                            runAnalysis("match");
                                            // After match, auto-run interview too
                                            setTimeout(() => {
                                                if (activeTab !== "tailor") {
                                                    const token = getToken();
                                                    clientServer
                                                        .post("/resume/ai/mock-interview", {
                                                            token,
                                                            resumeId: selectedResumeId,
                                                            jobDescription,
                                                        })
                                                        .then(({ data }) =>
                                                            setInterviewResult(data.questions)
                                                        )
                                                        .catch(() => {});
                                                }
                                            }, 500);
                                        }}
                                    >
                                        <Rocket size={18} />
                                        {loadingTab ? "Analyzing..." : "Analyze"}
                                    </button>

                                    {!canAnalyze && jobDescription.length > 0 && jobDescription.length <= 20 && (
                                        <p style={{ fontSize: "0.75rem", color: "var(--neon-pink)", textAlign: "center" }}>
                                            JD is too short — paste the full description
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tab Bar */}
                        <div className={styles.tabBar}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Results */}
                        <div className={styles.resultsPanel}>
                            {activeTab === "match" && renderMatchTab()}
                            {activeTab === "tailor" && renderTailorTab()}
                            {activeTab === "interview" && renderInterviewTab()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

AIToolsPage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);

export default AIToolsPage;
