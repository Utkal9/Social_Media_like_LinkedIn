import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer/index.js";
export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
});
