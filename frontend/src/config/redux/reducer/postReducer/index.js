import { createSlice } from "@reduxjs/toolkit";
import {
    getAllComments,
    getAllPosts,
    incrementPostLike,
} from "../../action/postAction";

const initialState = {
    posts: [],
    isError: false,
    postFetched: false,
    isLoading: false,
    loggedIn: false,
    message: "",
    comments: [],
    postId: "",
};
const postSlice = createSlice({
    name: "post",
    initialState,
    reducers: {
        reset: () => initialState,
        resetPostId: (state) => {
            state.postId = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllPosts.pending, (state) => {
                state.isLoading = true;
                state.message = "Fetching all the posts...";
            })
            .addCase(getAllPosts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.postFetched = true;
                const cleanPosts = action.payload.posts.filter(
                    (post) => post && post.userId
                );
                state.posts = cleanPosts.reverse();
            })
            .addCase(getAllPosts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getAllComments.fulfilled, (state, action) => {
                state.postId = action.payload.post_id;
                state.comments = action.payload.comments;
            })
            .addCase(incrementPostLike.fulfilled, (state, action) => {
                // You can leave this empty, or just set a success message
                state.message = "Post like toggled";
            });
    },
});
export const { resetPostId } = postSlice.actions;
export default postSlice.reducer;
