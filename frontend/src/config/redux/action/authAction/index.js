import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "../../../index.jsx";

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
export const sendConnectionRequest = createAsyncThunk(
    "user/sendConnectionRequest",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.post(
                "/user/send_connection_request",
                {
                    token: user.token,
                    connectionId: user.user_id,
                }
            );
            // --- NEW: Refresh only the 'sent' list ---
            thunkAPI.dispatch(getPendingSentRequests({ token: user.token }));
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

// --- NEW ACTION ---
export const respondToConnectionRequest = createAsyncThunk(
    "user/respondToConnectionRequest",
    async (data, thunkAPI) => {
        // data: { token, requestId, action_type: "accept" | "decline" }
        try {
            const response = await clientServer.post(
                "/user/respond_connection_request",
                {
                    token: data.token,
                    requestId: data.requestId,
                    action_type: data.action_type,
                }
            );
            // --- NEW: Refresh all connection states after responding ---
            thunkAPI.dispatch(
                getPendingIncomingRequests({ token: data.token })
            );
            thunkAPI.dispatch(getPendingSentRequests({ token: data.token }));
            thunkAPI.dispatch(getMyNetwork({ token: data.token }));
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

// --- NEW ACTION ---
export const getMyNetwork = createAsyncThunk(
    "user/getMyNetwork",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get("/user/get_my_network", {
                params: { token: user.token },
            });
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

// --- NEW ACTION ---
export const getPendingIncomingRequests = createAsyncThunk(
    "user/getPendingIncomingRequests",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get(
                "/user/get_pending_incoming",
                {
                    params: { token: user.token },
                }
            );
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

// --- NEW ACTION ---
export const getPendingSentRequests = createAsyncThunk(
    "user/getPendingSentRequests",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get("/user/get_pending_sent", {
                params: { token: user.token },
            });
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);
