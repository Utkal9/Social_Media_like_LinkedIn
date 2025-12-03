// frontend/src/pages/index.jsx
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, useInView } from "framer-motion";

// --- Tech Stack Icons ---
const techStack = [
    "REACT",
    "NEXT.JS",
    "REDUX",
    "NODE.JS",
    "EXPRESS",
    "MONGODB",
    "SOCKET.IO",
    "WEBRTC",
    "CLOUDINARY",
    "JWT",
];

// --- Icons ---
const EmailIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.contactSvg}>
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
);
const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.contactSvg}>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
);

// --- ANIMATED COUNTER COMPONENT ---
const AnimatedCounter = ({ end, suffix = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const duration = 2000;
            const increment = end / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, end]);

    return (
        <span ref={ref}>
            {count}
            {suffix}
        </span>
    );
};

// --- INTERACTIVE DEMO COMPONENTS ---

// 1. Resume Builder Demo (Interactive Input)
const ResumeDemo = () => {
    const [name, setName] = useState("John Doe");
    return (
        <div className={styles.mockDoc}>
            <div className={styles.docInputWrapper}>
                <label>Input Identity:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={18}
                    className={styles.demoInput}
                    placeholder="Type name..."
                />
            </div>
            {/* The Document Preview */}
            <div className={styles.docHeader}>
                <div className={styles.docName}>{name || "Anonymous"}</div>
                <div
                    className={styles.docLine}
                    style={{ width: "40%", height: "8px", marginTop: "5px" }}
                ></div>
            </div>
            <div className={styles.docBody}>
                <div className={styles.docRow}></div>
                <div className={styles.docRow} style={{ width: "80%" }}></div>
                <div className={styles.docRow} style={{ width: "60%" }}></div>
                <div className={styles.docBtn}>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                    </svg>
                    Download .DOCX
                </div>
            </div>
        </div>
    );
};

// 2. Social Feed Like Demo (Interactive Button)
const PostDemo = () => {
    const [likes, setLikes] = useState(124);
    const [liked, setLiked] = useState(false);

    const handleLike = () => {
        if (liked) {
            setLikes((prev) => prev - 1);
            setLiked(false);
        } else {
            setLikes((prev) => prev + 1);
            setLiked(true);
        }
    };

    return (
        <div className={styles.mockPost}>
            <div className={styles.mockPostHeader}>
                <div className={styles.mockAvatar}></div>
                <div className={styles.mockMeta}>
                    <div
                        className={styles.mockLine}
                        style={{ width: "80px" }}
                    ></div>
                    <div
                        className={styles.mockLine}
                        style={{ width: "50px", opacity: 0.5 }}
                    ></div>
                </div>
            </div>
            <div className={styles.mockContent}>
                <div className={styles.typingText}>
                    "Just deployed the new neural protocol!" 🚀
                </div>
            </div>
            <div className={styles.mockActions}>
                <button
                    onClick={handleLike}
                    className={`${styles.demoActionBtn} ${
                        liked ? styles.liked : ""
                    }`}
                >
                    ❤️ {likes}
                </button>
                <button className={styles.demoActionBtn}>💬 Comment</button>
            </div>
        </div>
    );
};

// 3. Connection Demo (Simulated Connection)
const ConnectDemo = () => {
    const [status, setStatus] = useState("idle"); // idle, connecting, connected

    const handleConnect = () => {
        setStatus("connecting");
        setTimeout(() => setStatus("connected"), 1500);
    };

    return (
        <div className={styles.mockChat}>
            <div className={styles.chatBubbleLeft}>
                Incoming Video Request...
            </div>
            <div
                className={styles.videoCallBtn}
                onClick={handleConnect}
                style={{
                    cursor: "pointer",
                    background:
                        status === "connected" ? "var(--neon-teal)" : undefined,
                    color: status === "connected" ? "#000" : undefined,
                }}
            >
                {status === "idle" && (
                    <>
                        <div className={styles.camIcon}></div> Accept Uplink
                    </>
                )}
                {status === "connecting" && "Establishing Secure Line..."}
                {status === "connected" && (
                    <span>● Secure Connection Active</span>
                )}
            </div>
        </div>
    );
};

export default function Home() {
    const router = useRouter();
    const { isTokenThere } = useSelector((state) => state.auth);

    // Dynamic Navigation Logic
    const handleMainAction = () => {
        if (isTokenThere || localStorage.getItem("token")) {
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    };

    return (
        <div className={styles.landingWrapper}>
            <Head>
                <title>LinkUps | The Professional Neural Network</title>
                <meta
                    name="description"
                    content="Connect, Collaborate, Evolve. The next-gen professional network."
                />
            </Head>

            {/* --- HERO SECTION --- */}
            <section className={styles.heroSection}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className={styles.heroContent}
                >
                    <div className={styles.heroBadge}>
                        <span className={styles.pulseDot}></span> v2.0 System
                        Online
                    </div>
                    <h1 className={styles.heroTitle}>
                        Connect. Collaborate. <br />
                        <span className={styles.gradientText}>Evolve.</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        The next-generation professional network. Build your
                        identity, connect with peers, and auto-generate your
                        resume in seconds.
                    </p>
                    <div className={styles.heroButtons}>
                        <button
                            onClick={handleMainAction}
                            className={styles.primaryBtn}
                        >
                            {isTokenThere
                                ? "Enter Dashboard"
                                : "Initialize Protocol"}
                        </button>
                        <button
                            onClick={() => router.push("/discover")}
                            className={styles.secondaryBtn}
                        >
                            Explore Nodes
                        </button>
                    </div>
                </motion.div>

                {/* --- MAIN VISUAL --- */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={styles.heroVisual}
                >
                    <div className={styles.hologramFrame}>
                        <div className={styles.imageWrapper}>
                            <div className={styles.scanline}></div>
                            {/* Main Image Preserved */}
                            <img
                                src="/images/homemain_connection.jpg"
                                alt="Connecting People"
                                className={styles.heroImg}
                            />
                        </div>

                        {/* Floating Notifications */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 4,
                                ease: "easeInOut",
                            }}
                            className={`${styles.floatCard} ${styles.cardTopRight}`}
                        >
                            <div className={styles.cardIcon}>🚀</div>
                            <div>
                                <small
                                    style={{
                                        display: "block",
                                        color: "var(--text-secondary)",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    Status
                                </small>
                                <strong>Network Growth</strong>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 5,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                            className={`${styles.floatCard} ${styles.cardBottomLeft}`}
                        >
                            <div
                                className={styles.cardIcon}
                                style={{
                                    background: "var(--neon-teal)",
                                    color: "#000",
                                }}
                            >
                                💬
                            </div>
                            <div>
                                <small
                                    style={{
                                        display: "block",
                                        color: "var(--text-secondary)",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    New Message
                                </small>
                                <strong>Alex connected!</strong>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* --- TECH MARQUEE --- */}
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeContent}>
                    {[
                        ...techStack,
                        ...techStack,
                        ...techStack,
                        ...techStack,
                    ].map((tech, i) => (
                        <span key={i} className={styles.techItem}>
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            {/* --- FEATURE 1: PROFILE & RESUME --- */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={styles.featureSection}
            >
                <div className={styles.featureText}>
                    <h2 className={styles.featureTitle}>
                        Smart Identity & Resume
                    </h2>
                    <p className={styles.featureDesc}>
                        Stop wasting time formatting Word documents. Fill out
                        your LinkUps profile once, and our{" "}
                        <strong>Smart Builder</strong> generates a professional,
                        ATS-friendly DOCX resume instantly.
                    </p>
                    <ul className={styles.featureList}>
                        <li>✅ One-Click Download</li>
                        <li>✅ ATS Optimized Layout</li>
                        <li>✅ Real-time Preview Logic</li>
                    </ul>
                </div>
                <div className={styles.featureDemo}>
                    <ResumeDemo />
                </div>
            </motion.section>

            {/* --- FEATURE 2: SOCIAL FEED --- */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`${styles.featureSection} ${styles.reverse}`}
            >
                <div className={styles.featureText}>
                    <h2 className={styles.featureTitle}>Live Data Stream</h2>
                    <p className={styles.featureDesc}>
                        Share updates, images, and videos with your network.
                        Engage with unique reaction types and real-time
                        comments. Try the interactive demo to the left!
                    </p>
                </div>
                <div className={styles.featureDemo}>
                    <PostDemo />
                </div>
            </motion.section>

            {/* --- FEATURE 3: CONNECT & CHAT --- */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={styles.featureSection}
            >
                <div className={styles.featureText}>
                    <h2 className={styles.featureTitle}>
                        Encrypted Communication
                    </h2>
                    <p className={styles.featureDesc}>
                        Connect with developers and creators. Start secure
                        1-on-1 chats or launch an instant
                        <strong> Video Uplink</strong> meeting.
                    </p>
                    <div className={styles.tagContainer}>
                        <span className={styles.techTag}>Socket.io</span>
                        <span className={styles.techTag}>WebRTC</span>
                        <span className={styles.techTag}>Secure</span>
                    </div>
                </div>
                <div className={styles.featureDemo}>
                    <ConnectDemo />
                </div>
            </motion.section>

            {/* --- LIVE STATS --- */}
            <section className={styles.statsSection}>
                <div className={styles.statCard}>
                    <h3>
                        <AnimatedCounter end={10000} suffix="+" />
                    </h3>
                    <p>Active Nodes</p>
                </div>
                <div className={styles.statCard}>
                    <h3>
                        <AnimatedCounter end={500} suffix="TB" />
                    </h3>
                    <p>Data Transmitted</p>
                </div>
                <div className={styles.statCard}>
                    <h3>99.9%</h3>
                    <p>Uptime Reliability</p>
                </div>
                <div className={styles.statCard}>
                    <h3>24/7</h3>
                    <p>Global Uplink</p>
                </div>
            </section>

            {/* --- MEET THE DEVELOPER --- */}
            <section className={styles.developerSection}>
                <div className={styles.devContentWrapper}>
                    <h2 className={styles.sectionTitle}>Meet the Architect</h2>
                    <p className={styles.sectionSubtitle}>
                        Engineered for scalability.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={styles.devCard}
                    >
                        <div className={styles.devAvatarWrapper}>
                            <img
                                src="https://github.com/utkal9.png"
                                alt="Utkal Behera"
                                className={styles.devAvatar}
                            />
                            <div className={styles.avatarRing}></div>
                        </div>
                        <div className={styles.devInfo}>
                            <h3 className={styles.devName}>Utkal Behera</h3>
                            <p className={styles.devRole}>
                                Full Stack Engineer & Architect
                            </p>
                            <p className={styles.devBio}>
                                Passionate about building scalable web
                                applications and connecting people through
                                technology. Built LinkUps to solve the friction
                                in professional networking.
                            </p>
                            <div className={styles.socialRow}>
                                <a
                                    href="mailto:utkalbehera59@gmail.com"
                                    className={styles.socialLink}
                                    title="Email Me"
                                >
                                    <EmailIcon />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/utkal-behera59/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialLink}
                                    title="Connect on LinkedIn"
                                >
                                    <LinkedInIcon />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className={styles.ctaSection}>
                <h2>Ready to Join the Grid?</h2>
                <p>Create your account today and start building your legacy.</p>
                <button
                    onClick={() => router.push("/login")}
                    className={styles.glowBtn}
                >
                    Start Registration
                </button>
            </section>
        </div>
    );
}

Home.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
