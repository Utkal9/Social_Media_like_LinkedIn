import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import clientServer from "@/config";
import ResumePreview from "@/Components/ResumePreview";
import { Lock, FileWarning } from "lucide-react";

export default function PublicResume() {
    const router = useRouter();
    const { id, print } = router.query;
    const isPrintMode = print === "1";

    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const loadResume = async () => {
            try {
                setLoading(true);

                // When called by Puppeteer, the backend injects resume data via
                // window.__RESUME_DATA__ BEFORE the page loads. Read it directly
                // to avoid any API call from within the headless browser.
                if (isPrintMode && typeof window !== "undefined" && window.__RESUME_DATA__) {
                    const injected = typeof window.__RESUME_DATA__ === "string"
                        ? JSON.parse(window.__RESUME_DATA__)
                        : window.__RESUME_DATA__;
                    setResumeData(injected);
                    setLoading(false);
                    return;
                }

                // Normal public view — respect the public flag
                const { data } = await clientServer.get(`/resume/public?resumeId=${id}`);
                setResumeData(data.resume);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    setError("private");
                } else {
                    setError("not_found");
                }
            } finally {
                setLoading(false);
            }
        };

        loadResume();
    }, [id, isPrintMode]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
                <div style={{ width: 48, height: 48, border: "4px solid #ddd", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isPrintMode && error === "private") {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f4f6", color: "#374151" }}>
                <Lock size={64} style={{ marginBottom: 16, color: "#9ca3af" }} />
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>This Resume is Private</h1>
                <p style={{ color: "#6b7280" }}>The owner of this resume has not made it public.</p>
            </div>
        );
    }

    if (error === "not_found" || !resumeData) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f4f6", color: "#374151" }}>
                <FileWarning size={64} style={{ marginBottom: 16, color: "#9ca3af" }} />
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Resume Not Found</h1>
                <p style={{ color: "#6b7280" }}>The link you followed may be broken or the resume was deleted.</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: isPrintMode ? "#fff" : "#f3f4f6", paddingTop: isPrintMode ? 0 : 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Head>
                <title>{resumeData?.personal_info?.full_name || "Resume"} | Linkups</title>
            </Head>

            {/* Download button — hidden in print/Puppeteer mode */}
            {!isPrintMode && (
                <div style={{ width: "100%", maxWidth: 794, display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <button
                        onClick={() => window.print()}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 600, cursor: "pointer" }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Print / Save PDF
                    </button>
                </div>
            )}

            <div style={{ width: "100%", maxWidth: 794, background: "#fff", boxShadow: isPrintMode ? "none" : "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                <ResumePreview
                    data={resumeData}
                    template={resumeData.template || "general"}
                    accentColor={resumeData.accent_color}
                    fontSize={resumeData.font_size || "default"}
                />
            </div>

            <style>{`
                @media print {
                    body { background: white !important; }
                    @page { margin: 0; size: A4 portrait; }
                }
            `}</style>
        </div>
    );
}
