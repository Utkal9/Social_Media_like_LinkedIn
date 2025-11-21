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
            // Refresh lists immediately
            thunkAPI.dispatch(getConnectionsRequest({ token: user.token }));
            thunkAPI.dispatch(getMyConnectionRequests({ token: user.token }));
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);
export const getConnectionsRequest = createAsyncThunk(
    "user/getConnectionRequests",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get(
                "/user/getConnectionRequests",
                {
                    params: {
                        token: user.token,
                    },
                }
            );
            // This returns 'connections' array for sent requests
            return thunkAPI.fulfillWithValue(response.data.connections);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);
export const getMyConnectionRequests = createAsyncThunk(
    "user/getMyConnectionRequests",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get(
                "/user/user_connection_request",
                {
                    params: {
                        token: user.token,
                    },
                }
            );
            // --- FIX: Added .connections to extract the array ---
            return thunkAPI.fulfillWithValue(response.data.connections);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);
export const AcceptConnection = createAsyncThunk(
    "user/acceptConnection",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.post(
                "/user/accept_connection_request",
                {
                    token: user.token,
                    requestId: user.connectionId,
                    action_type: user.action,
                }
            );
            thunkAPI.dispatch(getConnectionsRequest({ token: user.token }));
            thunkAPI.dispatch(getMyConnectionRequests({ token: user.token }));
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);
