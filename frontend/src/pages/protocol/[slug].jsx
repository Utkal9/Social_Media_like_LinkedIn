import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import clientServer from "@/config"; // Axios instance

export default function ProtocolPage() {
    const router = useRouter();
    const { slug } = router.query;

    // State for API Status Check
    const [status, setStatus] = useState({
        label: "Checking Uplink...",
        color: "#fbbf24",
    }); // Yellow default
    const [latency, setLatency] = useState(0);

    // --- LOGIC: Handle different pages ---
    useEffect(() => {
        if (!slug) return;

        // 1. Documentation -> Redirect to Swagger
        if (slug === "documentation") {
            // Use the backend URL for swagger.
            // If you are on localhost, it goes to localhost:9090/api-docs
            // If deployed, change this string to your production URL or use env variable
            const backendUrl =
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";
            window.location.href = `${backendUrl}/api-docs`;
        }

        // 2. API Status -> Real Health Check
        if (slug === "api-status") {
            const checkHealth = async () => {
                const start = Date.now();
                try {
                    // Pings the root "/" route of your backend
                    await clientServer.get("/");
                    const end = Date.now();
                    setLatency(end - start);
                    setStatus({
                        label: "All Systems Operational",
                        color: "#10b981",
                    }); // Green
                } catch (error) {
                    setStatus({
                        label: "System Outage Detected",
                        color: "#ef4444",
                    }); // Red
                }
            };
            checkHealth();
        }
    }, [slug]);

    // Content Data
    const contentMap = {
        "api-status": {
            title: "System Status",
            subtitle: "Real-time Service Monitoring",
            body: (
                <div
                    style={{
                        padding: "20px",
                        background: "var(--holo-glass)",
                        borderRadius: "12px",
                        border: "1px solid var(--holo-border)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: status.color,
                                boxShadow: `0 0 15px ${status.color}`,
                            }}
                        ></div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "1.5rem",
                                color: "var(--text-primary)",
                            }}
                        >
                            {status.label}
                        </h2>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: "15px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid var(--holo-border)",
                                paddingBottom: "10px",
                            }}
                        >
                            <span>API Gateway</span>
                            <span style={{ color: status.color }}>
                                {status.color === "#ef4444"
                                    ? "Offline"
                                    : "Online"}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid var(--holo-border)",
                                paddingBottom: "10px",
                            }}
                        >
                            <span>Database Shards</span>
                            <span style={{ color: status.color }}>
                                {status.color === "#ef4444"
                                    ? "Unreachable"
                                    : "Operational"}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Latency</span>
                            <span style={{ fontFamily: "monospace" }}>
                                {latency}ms
                            </span>
                        </div>
                    </div>
                </div>
            ),
        },
        security: {
            title: "Security Protocol",
            subtitle: "Encryption Level: High",
            body: (
                <>
                    <p>
                        Your data is secured using industry-standard encryption
                        standards.
                    </p>
                    <ul>
                        <li>Passwords hashed via Bcrypt (Salt rounds: 10)</li>
                        <li>HTTPS/TLS 1.3 enforcement</li>
                        <li>Private video signaling (P2P WebRTC)</li>
                    </ul>
                </>
            ),
        },
        "terms-of-service": {
            title: "Terms of Service",
            subtitle: "User Agreement",
            body: (
                <>
                    <p>
                        By accessing the LinkUps grid, you agree to maintain
                        professional conduct.
                    </p>
                    <p>1. Do not spam the neural network.</p>
                    <p>2. Respect user privacy and data sovereignty.</p>
                    <p>
                        3. Any unauthorized data mining will result in immediate
                        termination.
                    </p>
                </>
            ),
        },
        // Documentation is handled via redirect, but we keep a fallback just in case
        documentation: {
            title: "Redirecting...",
            subtitle: "Accessing Neural Archives",
            body: (
                <p>Please wait while we connect you to the API schematics...</p>
            ),
        },
    };

    // Default to loading or 404 state
    const pageContent = contentMap[slug] || {
        title: "404 - Data Not Found",
        subtitle: "Error",
        body: <p>The requested file does not exist in our archives.</p>,
    };

    return (
        <div
            style={{
                padding: "40px 20px",
                color: "var(--text-primary)",
                minHeight: "80vh",
            }}
        >
            <Head>
                <title>{pageContent.title} | LinkUps</title>
            </Head>

            <div
                style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    background: "var(--holo-panel)",
                    border: "1px solid var(--holo-border)",
                    borderRadius: "16px",
                    padding: "40px",
                    backdropFilter: "blur(10px)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <span
                    style={{
                        color: "var(--neon-teal)",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        display: "block",
                        marginBottom: "10px",
                    }}
                >
                    // PROTOCOL: {slug?.toUpperCase()}
                </span>

                <h1
                    style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: "2.5rem",
                        marginBottom: "10px",
                        color: "var(--text-primary)",
                    }}
                >
                    {pageContent.title}
                </h1>

                <p
                    style={{
                        color: "var(--text-secondary)",
                        marginBottom: "30px",
                        borderBottom: "1px solid var(--holo-border)",
                        paddingBottom: "20px",
                    }}
                >
                    {pageContent.subtitle}
                </p>

                <div style={{ lineHeight: "1.8", fontSize: "1.05rem" }}>
                    {pageContent.body}
                </div>

                <button
                    onClick={() => router.back()}
                    style={{
                        marginTop: "40px",
                        background: "transparent",
                        border: "1px solid var(--neon-violet)",
                        color: "var(--neon-violet)",
                        padding: "10px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    ← Return
                </button>
            </div>
        </div>
    );
}

ProtocolPage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
