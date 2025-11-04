import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";
import { getAllPosts } from "@/config/redux/action/postAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Dashboard() {
    const router = useRouter();

    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    useEffect(() => {
        if (authState.isTokenThere) {
            dispatch(getAllPosts());
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        }
        if (!authState.all_profiles_fetched) {
            dispatch(getAllUsers());
        }
    }, [authState.isTokenThere]);
    return (
        <UserLayout>
            {/* {authState.profileFetched && (
                <div>Hey {authState.user.userId.name}</div>
            )} */}
            <DashboardLayout>
                <div>
                    <h1>Dashboard</h1>
                </div>
            </DashboardLayout>
        </UserLayout>
    );
}
