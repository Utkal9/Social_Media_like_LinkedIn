import clientServer from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllPosts = createAsyncThunk(
    "post/getAllPosts",
    async (_, thunkAPI) => {
        try {
            const response = await clientServer.get("/posts");
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const createPost = createAsyncThunk(
    "post/createPost",
    async (userData, thunkAPI) => {
        const { file, body } = userData;
        try {
            const formData = new FormData();
            formData.append("token", localStorage.getItem("token"));
            formData.append("body", body);
            if (file) {
                formData.append("media", file);
            }
            const response = await clientServer.post("/post", formData, {
                headers: {
                    "Content-type": "multipart/form-data",
                },
            });
            if (response.status === 200) {
                await thunkAPI.dispatch(getAllPosts());
                return thunkAPI.fulfillWithValue("Post Uploaded");
            } else {
                return thunkAPI.rejectWithValue("Post not Uploaded");
            }
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const deletePost = createAsyncThunk(
    "post/deletePost",
    async (payload, thunkAPI) => {
        try {
            const response = await clientServer.post("/delete_post", {
                token: localStorage.getItem("token"),
                post_id: payload.post_id,
            });
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue("Something went wrong !");
        }
    }
);

export const toggleLike = createAsyncThunk(
    "post/toggleLike",
    async (data, thunkAPI) => {
        const { token, post_id, reactionType = "Like" } = data;
        try {
            const response = await clientServer.post("/toggle_like", {
                token: token,
                post_id: post_id,
                reactionType: reactionType,
            });
            thunkAPI.dispatch(getAllPosts());
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const getAllComments = createAsyncThunk(
    "post/getAllComments",
    async (postData, thunkAPI) => {
        try {
            const response = await clientServer.get("/get_comments", {
                params: {
                    post_id: postData.post_id,
                },
            });
            return thunkAPI.fulfillWithValue({
                comments: response.data,
                post_id: postData.post_id,
            });
        } catch (error) {
            return thunkAPI.rejectWithValue("Something went wrong !");
        }
    }
);

export const postComment = createAsyncThunk(
    "post/postComment",
    async (commentData, thunkAPI) => {
        try {
            const response = await clientServer.post("/comment", {
                token: localStorage.getItem("token"),
                post_id: commentData.post_id,
                commentBody: commentData.body,
            });
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue("Something went wrong !");
        }
    }
);

// --- NEW ACTION ---
export const toggleCommentLike = createAsyncThunk(
    "post/toggleCommentLike",
    async (data, thunkAPI) => {
        try {
            const response = await clientServer.post("/toggle_comment_like", {
                token: data.token,
                comment_id: data.comment_id,
            });
            // Refresh comments to show updated likes
            thunkAPI.dispatch(getAllComments({ post_id: data.post_id }));
            return thunkAPI.fulfillWithValue(response.data);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);
