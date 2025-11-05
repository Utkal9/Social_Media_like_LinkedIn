import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer/index.js";
import postReducer from "./reducer/postReducer/index.js";
/*
STEPS for State Management
Submit action
Handle Action in it's reducer
Register Here -> Reducer
*/

export const store = configureStore({
    reducer: {
        auth: authReducer,
        postReducer: postReducer,
    },
});
