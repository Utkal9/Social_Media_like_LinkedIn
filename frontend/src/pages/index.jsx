// frontend/src/pages/index.jsx
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";

// --- Feature Icons ---
const AuthIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
);
const ProfileIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);
const ResumeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
);
const FeedIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
    </svg>
);
const NetworkIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
);
const ChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
    </svg>
);
const VideoCallIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.cardSvg}>
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

// --- Contact Icons ---
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

export default function Home() {
    const router = useRouter();

    const features = [
        {
            title: "Secure Access",
            desc: "Encrypted entry nodes with JWT authentication.",
            icon: <AuthIcon />,
        },
        {
            title: "Pro Profile",
            desc: "Manage your professional identity, skills, and career timeline.",
            icon: <ProfileIcon />,
        },
        {
            title: "Smart Resume",
            desc: "Auto-compile your data into a professional .docx resume.",
            icon: <ResumeIcon />,
        },
        {
            title: "LinkUps Feed",
            desc: "Share updates, media, and thoughts with the network.",
            icon: <FeedIcon />,
        },
        {
            title: "Network Sync",
            desc: "Send requests and build your web of professional nodes.",
            icon: <NetworkIcon />,
        },
        {
            title: "Instant Chat",
            desc: "Real-time encrypted messaging with your connections.",
            icon: <ChatIcon />,
        },
        {
            title: "Live Meet",
            desc: "High-fidelity video conferencing for meetings.",
            icon: <VideoCallIcon />,
        },
        {
            title: "Global Discovery",
            desc: "Scan the grid to find new professionals and opportunities.",
            icon: <SearchIcon />,
        },
    ];

    return (
        <div className={styles.holoPageWrapper}>
            <Head>
                <title>LinkUps | Professional Network</title>
            </Head>

            {/* Background FX */}
            <div className={styles.cyberGrid}></div>
            <div
                className={styles.orbGlow}
                style={{ top: "-10%", left: "-10%" }}
            ></div>
            <div
                className={styles.orbGlow}
                style={{
                    bottom: "10%",
                    right: "-10%",
                    background: "var(--neon-teal)",
                    opacity: 0.15,
                }}
            ></div>

            <main className={`container ${styles.mainContainer}`}>
                {/* --- HERO SECTION --- */}
                <div className="row min-vh-100 align-items-center py-5">
                    {/* LEFT COLUMN: Text Content */}
                    <div className="col-lg-6 col-md-12 d-flex flex-column justify-content-center z-1 order-2 order-lg-1 text-center text-lg-start">
                        <div
                            className={`d-inline-flex align-items-center mx-auto mx-lg-0 ${styles.betaBadge}`}
                        >
                            <span className={styles.statusDot}></span>
                            <span className="ms-2">LinkUps UI v2.0</span>
                        </div>

                        <h1
                            className={`display-3 fw-bold mt-4 mb-3 ${styles.heroTitle}`}
                        >
                            Connect in the <br />
                            <span className={styles.neonText}>
                                Professional Network.
                            </span>
                        </h1>

                        <p className={`lead mb-5 ${styles.heroSubtitle}`}>
                            A next-gen ecosystem for professionals. Experience
                            networking, dynamic profiles, and seamless
                            collaboration in a secure environment.
                        </p>

                        <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                            <button
                                onClick={() => router.push("/login")}
                                className={styles.btnHoloPrimary}
                            >
                                Initialize
                            </button>
                            <button
                                onClick={() => router.push("/discover")}
                                className={styles.btnHoloOutline}
                            >
                                Explore Nodes
                            </button>
                        </div>

                        {/* Stats Section */}
                        <div className="row mt-5 pt-4 border-top border-light border-opacity-10 g-4">
                            <div className="col-6 col-sm-4">
                                <h3 className={styles.statNumber}>150k+</h3>
                                <p className={styles.statLabel}>Active Users</p>
                            </div>
                            <div className="col-6 col-sm-4">
                                <h3 className={styles.statNumber}>99.9%</h3>
                                <p className={styles.statLabel}>Uptime</p>
                            </div>
                            <div className="col-12 col-sm-4 pt-3 pt-sm-0">
                                <div className={styles.trustBadge}>
                                    <span>🛡️ Verified Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Visuals */}
                    <div className="col-lg-6 col-md-12 d-flex justify-content-center align-items-center z-2 order-1 order-lg-2 mb-5 mb-lg-0">
                        <div className={styles.hologramFrame}>
                            {/* Main Image with Glass Effect */}
                            <div className={styles.imageWrapper}>
                                <div className={styles.scanline}></div>
                                <img
                                    src="/images/homemain_connection.jpg"
                                    alt="Future Connection"
                                    className={styles.heroImg}
                                />
                            </div>

                            {/* Floating UI Cards (Decorative) */}
                            <div
                                className={`${styles.floatCard} ${styles.cardTopRight}`}
                            >
                                <div className={styles.cardIcon}>🚀</div>
                                <div>
                                    <small className="text-muted d-block">
                                        Status
                                    </small>
                                    <strong>Network Sync</strong>
                                </div>
                            </div>

                            <div
                                className={`${styles.floatCard} ${styles.cardBottomLeft}`}
                            >
                                <div
                                    className={styles.cardIcon}
                                    style={{ background: "var(--neon-teal)" }}
                                >
                                    💬
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        New Message
                                    </small>
                                    <strong>Alex connected!</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FEATURES SECTION --- */}
                <section className={styles.featuresSection}>
                    <h2 className={styles.sectionTitle}>System Capabilities</h2>
                    <p className={styles.sectionSubtitle}>
                        Core modules loaded and operational.
                    </p>

                    <div className={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.iconWrapper}>
                                    {feature.icon}
                                </div>
                                <h3 className={styles.featureTitle}>
                                    {feature.title}
                                </h3>
                                <p className={styles.featureDesc}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- MEET THE DEVELOPER SECTION --- */}
                <section className={styles.developerSection}>
                    <div className={styles.devContentWrapper}>
                        <h2 className={styles.sectionTitle}>
                            Meet the Developer
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            The architect behind the LinkUps grid.
                        </p>

                        <div className={styles.devCard}>
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
                                    Building next-gen social architectures with
                                    modern web technologies. Connecting nodes,
                                    one block at a time.
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
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

Home.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
