import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "../../../index.jsx";

export const getNotifications = createAsyncThunk(
    "notification/get",
    async ({ token }, thunkAPI) => {
        try {
            const response = await clientServer.get("/notifications", {
                params: { token },
            });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const markRead = createAsyncThunk(
    "notification/read",
    async ({ token, notificationId }, thunkAPI) => {
        await clientServer.post("/notifications/mark_read", {
            token,
            notificationId,
        });
        return notificationId;
    }
);

const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        notifications: [],
        unreadCount: 0,
        isLoading: false,
    },
    reducers: {
        addNewNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getNotifications.fulfilled, (state, action) => {
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter((n) => !n.isRead).length;
        });
        builder.addCase(markRead.fulfilled, (state, action) => {
            const index = state.notifications.findIndex(
                (n) => n._id === action.payload
            );
            if (index !== -1 && !state.notifications[index].isRead) {
                state.notifications[index].isRead = true;
                state.unreadCount -= 1;
            }
        });
    },
});

export const { addNewNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
