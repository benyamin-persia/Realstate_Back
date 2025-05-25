import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import "./profilePage.scss";
import apiRequest from "../../lib/apiRequest";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import { Suspense, useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

function ProfilePage() {
  const data = useLoaderData();
  const { updateUser, currentUser } = useContext(AuthContext);
  const [chat, setChat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const state = navigate.state;
    if (state?.openChat) {
      setChat(state.openChat);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="error-container">
        <h2>Please log in to view your profile</h2>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          <div className="title">
            <h1>User Information</h1>
            <Link to="/profile/update">
              <button>Update Profile</button>
            </Link>
          </div>
          <div className="info">
            <span>
              Avatar:
              <img src={currentUser.avatar || "noavatar.jpg"} alt="" />
            </span>
            <span>
              Username: <b>{currentUser.username}</b>
            </span>
            <span>
              E-mail: <b>{currentUser.email}</b>
            </span>
            <button onClick={handleLogout}>Logout</button>
          </div>
          <div className="title">
            <h1>My List</h1>
            <Link to="/add">
              <button>Create New Post</button>
            </Link>
          </div>
          <Suspense fallback={<p>Loading posts...</p>}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>Error loading posts! Please try refreshing the page.</p>}
            >
              {(postResponse) => {
                console.log("Post Response:", postResponse);
                if (!postResponse) {
                  console.log("No post response received");
                  return <p>No posts found</p>;
                }
                if (!postResponse.userPosts && !postResponse.savedPosts) {
                  console.log("No user posts or saved posts in response");
                  return <p>No posts found</p>;
                }
                console.log("User Posts:", postResponse.userPosts);
                return <List posts={postResponse.userPosts || []} />;
              }}
            </Await>
          </Suspense>
          <div className="title">
            <h1>Saved List</h1>
          </div>
          <Suspense fallback={<p>Loading saved posts...</p>}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>Error loading saved posts! Please try refreshing the page.</p>}
            >
              {(postResponse) => {
                console.log("Saved Posts Response:", postResponse);
                if (!postResponse) {
                  console.log("No saved posts response received");
                  return <p>No saved posts found</p>;
                }
                if (!postResponse.savedPosts) {
                  console.log("No saved posts in response");
                  return <p>No saved posts found</p>;
                }
                console.log("Saved Posts:", postResponse.savedPosts);
                return <List posts={postResponse.savedPosts || []} />;
              }}
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="chatContainer">
        <div className="wrapper">
          <Suspense fallback={<p>Loading chats...</p>}>
            <Await
              resolve={data.chatResponse}
              errorElement={<p>Error loading chats! Please try refreshing the page.</p>}
            >
              {(chatResponse) => <Chat chats={chatResponse} chatId={chat} />}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
