// frontend/src/pages/index.jsx
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";

// --- Tech Stack Data ---
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
    "PASSPORT.JS",
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

const TestimonialCard = ({ name, role, text, img }) => (
    <div className={styles.testimonialCard}>
        <div className={styles.testiHeader}>
            <img src={img} alt={name} className={styles.testiAvatar} />
            <div>
                <h4>{name}</h4>
                <span>{role}</span>
            </div>
        </div>
        <p>"{text}"</p>
        <div className={styles.stars}>★★★★★</div>
    </div>
);

export default function Home() {
    const router = useRouter();

    return (
        <div className={styles.landingWrapper}>
            <Head>
                <title>LinkUps | The Professional Neural Network</title>
            </Head>

            {/* --- HERO SECTION --- */}
            <section className={styles.heroSection}>
                <div className={styles.heroContent}>
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
                            onClick={() => router.push("/login")}
                            className={styles.primaryBtn}
                        >
                            Initialize Protocol
                        </button>
                        <button
                            onClick={() => router.push("/discover")}
                            className={styles.secondaryBtn}
                        >
                            Explore Nodes
                        </button>
                    </div>
                </div>

                {/* --- RESTORED: ORIGINAL HERO VISUAL --- */}
                <div className={styles.heroVisual}>
                    <div className={styles.hologramFrame}>
                        {/* Main Image with Glass Effect */}
                        <div className={styles.imageWrapper}>
                            <div className={styles.scanline}></div>
                            <img
                                src="/images/homemain_connection.jpg"
                                alt="Connecting People"
                                className={styles.heroImg}
                            />
                        </div>

                        {/* Floating UI Cards (Decorative) */}
                        <div
                            className={`${styles.floatCard} ${styles.cardTopRight}`}
                        >
                            <div className={styles.cardIcon}>🚀</div>
                            <div>
                                <small
                                    style={{
                                        display: "block",
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    Updates
                                </small>
                                <strong>Network Growth</strong>
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
                                <small
                                    style={{
                                        display: "block",
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    New Message
                                </small>
                                <strong>Alex connected!</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TECH MARQUEE --- */}
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeContent}>
                    {[...techStack, ...techStack, ...techStack].map(
                        (tech, i) => (
                            <span key={i} className={styles.techItem}>
                                {tech}
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* --- FEATURE 1: PROFILE & RESUME --- */}
            <section className={styles.featureSection}>
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
                        <li>✅ Auto-Synced with Profile</li>
                    </ul>
                </div>
                <div className={styles.featureDemo}>
                    <div className={styles.mockDoc}>
                        <div className={styles.docHeader}>
                            <div
                                className={styles.docLine}
                                style={{ width: "40%", height: "20px" }}
                            ></div>
                            <div
                                className={styles.docLine}
                                style={{ width: "20%" }}
                            ></div>
                        </div>
                        <div className={styles.docBody}>
                            <div className={styles.docRow}></div>
                            <div className={styles.docRow}></div>
                            <div className={styles.docRow}></div>
                            <div className={styles.docBtn}>Download .DOCX</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 2: SOCIAL FEED --- */}
            <section className={`${styles.featureSection} ${styles.reverse}`}>
                <div className={styles.featureText}>
                    <h2 className={styles.featureTitle}>Live Data Stream</h2>
                    <p className={styles.featureDesc}>
                        Share updates, images, and videos with your network.
                        Engage with 5 unique reaction types and real-time
                        comments. Your professional voice, amplified.
                    </p>
                </div>
                <div className={styles.featureDemo}>
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
                        <div className={styles.mockContent}></div>
                        <div className={styles.mockActions}>
                            <span>❤️ Like</span>
                            <span>💬 Comment</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 3: CONNECT & CHAT --- */}
            <section className={styles.featureSection}>
                <div className={styles.featureText}>
                    <h2 className={styles.featureTitle}>
                        Encrypted Communication
                    </h2>
                    <p className={styles.featureDesc}>
                        Connect with developers and creators. Start secure
                        1-on-1 chats or launch an instant{" "}
                        <strong>Video Uplink</strong> meeting directly from your
                        dashboard.
                    </p>
                    <div className={styles.tagContainer}>
                        <span className={styles.techTag}>Socket.io</span>
                        <span className={styles.techTag}>WebRTC</span>
                        <span className={styles.techTag}>Secure</span>
                    </div>
                </div>
                <div className={styles.featureDemo}>
                    <div className={styles.mockChat}>
                        <div className={styles.chatBubbleLeft}>
                            Hey, are you available?
                        </div>
                        <div className={styles.chatBubbleRight}>
                            Yes, let's start a video call.
                        </div>
                        <div className={styles.videoCallBtn}>
                            <div className={styles.camIcon}></div> Join Meeting
                        </div>
                    </div>
                </div>
            </section>

            {/* --- LIVE STATS --- */}
            <section className={styles.statsSection}>
                <div className={styles.statCard}>
                    <h3>10k+</h3>
                    <p>Active Nodes</p>
                </div>
                <div className={styles.statCard}>
                    <h3>500TB</h3>
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
                    <h2 className={styles.sectionTitle}>Meet the Developer</h2>
                    <p className={styles.sectionSubtitle}>
                        The engineer behind LinkUps.
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
                                Passionate about building scalable web
                                applications and connecting people through
                                technology.
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

            {/* --- TESTIMONIALS --- */}
            <section className={styles.testimonialsSection}>
                <h2 className={styles.sectionHeader}>User Logs</h2>
                <div className={styles.testiGrid}>
                    <TestimonialCard
                        name="Alex Chen"
                        role="Full Stack Dev"
                        img="https://randomuser.me/api/portraits/men/32.jpg"
                        text="LinkUps changed how I connect. The Resume Builder alone saved me hours of work."
                    />
                    <TestimonialCard
                        name="Sarah Jenkins"
                        role="Product Designer"
                        img="https://randomuser.me/api/portraits/women/44.jpg"
                        text="The UI is incredibly smooth. It feels like using a tool from the future."
                    />
                    <TestimonialCard
                        name="David Kim"
                        role="DevOps Engineer"
                        img="https://randomuser.me/api/portraits/men/86.jpg"
                        text="Finally, a networking platform that doesn't feel cluttered. Pure signal, no noise."
                    />
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
