import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "../../../index.jsx";
import { headers } from "next/headers.js";

export const loginUser = createAsyncThunk(
    "user/login",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.post("/login", {
                email: user.email,
                password: user.password,
            });
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            } else {
                return thunkAPI.rejectWithValue({
                    message: "Token not found",
                });
            }
            return thunkAPI.fulfillWithValue(response.data.token);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const registerUser = createAsyncThunk(
    "user/register",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.post("/register", {
                name: user.name,
                username: user.username,
                email: user.email,
                password: user.password,
            });

            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const getAboutUser = createAsyncThunk(
    "user/getAboutUser",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get("/get_user_and_profile", {
                params: {
                    token: user.token,
                },
            });

            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);
export const getAllUsers = createAsyncThunk(
    "user/getAllUsers",
    async (_, thunkAPI) => {
        try {
            const response = await clientServer.get("/user/getAllUserProfile");
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);
