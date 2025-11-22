// frontend/src/pages/index.jsx
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";

export default function Home() {
    const router = useRouter();

    return (
        <div className={styles.holoPageWrapper}>
            <Head>
                <title>Pro Connect | HoloStream</title>
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
                <div className="row min-vh-100 align-items-center py-5">
                    {/* LEFT COLUMN: Text Content */}
                    <div className="col-lg-6 col-md-12 d-flex flex-column justify-content-center z-1 order-2 order-lg-1 text-center text-lg-start">
                        <div
                            className={`d-inline-flex align-items-center mx-auto mx-lg-0 ${styles.betaBadge}`}
                        >
                            <span className={styles.statusDot}></span>
                            <span className="ms-2">HoloStream UI v2.0</span>
                        </div>

                        <h1
                            className={`display-3 fw-bold mt-4 mb-3 ${styles.heroTitle}`}
                        >
                            Connect in the <br />
                            <span className={styles.neonText}>
                                Neural Network.
                            </span>
                        </h1>

                        <p className={`lead mb-5 ${styles.heroSubtitle}`}>
                            A next-gen professional ecosystem. Experience 3D
                            networking, holographic profiles, and seamless
                            collaboration in a cyber-secured environment.
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
            </main>
        </div>
    );
}

Home.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
