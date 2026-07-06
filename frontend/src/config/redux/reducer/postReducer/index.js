import { createSlice } from "@reduxjs/toolkit";
import { getAllComments, getAllPosts } from "../../action/postAction";

const initialState = {
    posts: [],
    isError: false,
    postFetched: false,
    isLoading: false,
    loggedIn: false,
    message: "",
    comments: [],
    postId: "",
    hasMore: true,
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

                const newPosts = action.payload.posts; // Backend now returns newest first, so no .reverse() needed
                const fetchedPage = action.payload.fetchedPage;

                if (fetchedPage === 1) {
                    state.posts = newPosts;
                } else {
                    // Append new posts, but avoid duplicates based on _id
                    const existingIds = new Set(state.posts.map(p => p._id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                    state.posts = [...state.posts, ...uniqueNewPosts];
                }

                state.hasMore = action.payload.hasMore;
            })
            .addCase(getAllPosts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getAllComments.fulfilled, (state, action) => {
                state.postId = action.payload.post_id;
                state.comments = action.payload.comments.reverse();
            });
    },
});
export const { resetPostId, reset: resetPosts } = postSlice.actions;
export default postSlice.reducer;
