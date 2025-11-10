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
                // Get the updated post from the action payload
                const updatedPost = action.payload.post;
                if (!updatedPost) {
                    return;
                }
                // Find the index of the post in our state
                const postIndex = state.posts.findIndex(
                    (post) => post && post._id === updatedPost._id
                );
                // If found, replace it with the new updated post
                if (postIndex > -1) {
                    state.posts[postIndex] = updatedPost;
                }
            });
    },
});
export const { resetPostId } = postSlice.actions;
export default postSlice.reducer;
