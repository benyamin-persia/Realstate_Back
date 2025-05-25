import { defer } from "react-router-dom";
import apiRequest from "./apiRequest";

export const singlePageLoader = async ({ params, request }) => {
  try {
    console.log("Single page loader started for post ID:", params.id);
    const searchParams = new URL(request.url).searchParams;
    const showDeleted = searchParams.get('showDeleted') === 'true';
    
    console.log("Making API request with showDeleted:", showDeleted);
    const res = await apiRequest.get(`/posts/${params.id}${showDeleted ? '?showDeleted=true' : ''}`);
    
    if (!res.data) {
      console.error("No data received from server");
      throw new Error("No data received from server");
    }
    
    console.log("Post data received:", {
      id: res.data.id,
      title: res.data.title,
      hasPostDetail: !!res.data.postDetail,
      hasUser: !!res.data.user
    });
    
    return res.data;
  } catch (err) {
    console.error("Error in singlePageLoader:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers
    });
    
    // Check if it's a 404 error
    if (err.response?.status === 404) {
      throw new Error("Post not found. It may have been deleted or you don't have permission to view it.");
    }
    
    // Check if it's a server error
    if (err.response?.status === 500) {
      console.error("Server error details:", err.response?.data);
      throw new Error(err.response?.data?.message || "Server error. Please try again later");
    }
    
    // For other errors
    throw new Error(err.response?.data?.message || "Failed to load post. Please try again");
  }
};

export const listPageLoader = async ({ request, params }) => {
  const query = request.url.split("?")[1];
  const postPromise = apiRequest("/posts" + (query ? `?${query}` : ""));
  return defer({
    postResponse: postPromise,
  });
};

export const profilePageLoader = async () => {
  try {
    console.log("Fetching profile posts...");
    const response = await apiRequest.get("/users/profilePosts");
    
    if (!response.data) {
      console.error("No data received from server");
      throw new Error("No data received from server");
    }

    console.log("Profile posts response:", {
      userPostsCount: response.data.userPosts?.length || 0,
      savedPostsCount: response.data.savedPosts?.length || 0
    });

    return defer({
      postResponse: Promise.resolve(response.data),
      chatResponse: apiRequest.get("/chats").then(res => res.data)
    });
  } catch (err) {
    console.error("Profile page loader error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers,
      stack: err.stack
    });

    // Check if it's an authentication error
    if (err.response?.status === 401) {
      throw new Error("Please log in to view your profile");
    }

    // Check if it's a server error
    if (err.response?.status === 500) {
      console.error("Server error details:", err.response?.data);
      throw new Error(err.response?.data?.message || "Server error. Please try again later");
    }

    // For other errors
    throw new Error(err.response?.data?.message || "Failed to load profile data. Please try again");
  }
};
