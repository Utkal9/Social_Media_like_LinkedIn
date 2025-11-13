import { createSlice } from "@reduxjs/toolkit";
import {
    getAllComments,
    getAllPosts,
    toggleLike,
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
                state.posts = action.payload.posts.reverse();
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
        // .addCase(toggleLike.pending, (state) => {
        //     // You could set a specific 'isLiking' state here if you want
        //     state.isLoading = true;
        // })
        // .addCase(toggleLike.fulfilled, (state, action) => {
        //     state.isLoading = false;

        //     // action.payload is { message, post_id, likes }
        //     const { post_id, likes } = action.payload;

        //     // Find the post in the state array
        //     const postIndex = state.posts.findIndex(
        //         (post) => post._id === post_id
        //     );

        //     // If found, update its 'likes' array directly
        //     if (postIndex !== -1) {
        //         state.posts[postIndex].likes = likes;
        //     }
        // })
        // .addCase(toggleLike.rejected, (state, action) => {
        //     state.isLoading = false;
        //     state.isError = true;
        //     state.message = action.payload; // Will show like/unlike error
        // });
    },
});
export const { resetPostId } = postSlice.actions;
export default postSlice.reducer;
