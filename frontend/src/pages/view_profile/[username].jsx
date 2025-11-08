import clientServer, { BASE_URL } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import styles from "./index.module.css";

export default function ViewProfilePage({ userProfile }) {
    const searchParams = useSearchParams();
    useEffect(() => {
        console.log("From View: View Profile");
    });
    return (
        <UserLayout>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.backDropContainer}>
                        <img
                            className={styles.backDrop}
                            src={`${BASE_URL}/${userProfile.userId.profilePicture}`}
                            alt="backDrop"
                        />
                    </div>
                    <div className={styles.profileContainer__details}>
                        <div style={{ display: "flex", gap: "0.7rem" }}>
                            <div style={{ flex: "0.8" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        width: "fit-content",
                                        alignItems: "center",
                                        gap: "1.2rem",
                                    }}
                                >
                                    <h2>{userProfile.userId.name}</h2>
                                    <p style={{ color: "grey" }}>
                                        @{userProfile.userId.username}
                                    </p>
                                </div>
                            </div>
                            <div style={{ flex: "0.2" }}></div>
                        </div>
                    </div>
                    {/* {userProfile.userId.name} */}
                </div>
            </DashboardLayout>
        </UserLayout>
    );
}
export async function getServerSideProps(context) {
    console.log("From View");
    console.log(context.query.username);
    const request = await clientServer.get(
        "/user/get_profile_based_on_username",
        {
            params: {
                username: context.query.username,
            },
        }
    );
    const response = await request.data;
    console.log(response);
    return { props: { userProfile: request.data.profile } };
}
