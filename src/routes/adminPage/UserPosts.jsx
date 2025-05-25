import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./userPosts.scss";
import apiRequest from "../../lib/apiRequest";

function UserPosts() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await apiRequest.get(`/users/${userId}`);
        setUserInfo(userResponse.data);

        // Fetch user posts
        const postsResponse = await apiRequest.get(`/users/${userId}/posts`);
        setPosts(postsResponse.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch user posts");
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleEditPost = (postId) => {
    navigate(`/add?edit=${postId}`);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest.delete(`/posts/${postId}`);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, deletedAt: new Date() } : post
      ));
    } catch (err) {
      setError("Failed to delete post");
    }
  };

  const handleRestorePost = async (postId) => {
    if (!window.confirm("Are you sure you want to restore this post?")) {
      return;
    }

    try {
      await apiRequest.put(`/posts/${postId}/restore`);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, deletedAt: null } : post
      ));
    } catch (err) {
      setError("Failed to restore post");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const filteredPosts = showDeleted ? posts : posts.filter(post => !post.deletedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPosts = posts.filter(post => new Date(post.createdAt) >= today && !post.deletedAt).length;
  const activePosts = posts.filter(post => !post.deletedAt).length;
  const deletedPosts = posts.filter(post => post.deletedAt).length;

  return (
    <div className="userPosts">
      <div className="wrapper">
        <div className="header">
          <div className="user-info">
            <h1>Posts by {userInfo?.username}</h1>
            <div className="post-limit">
              <span>Daily Post Limit: {userInfo?.postLimit || 5}</span>
              <div className="post-stats">
                <span>Today's Posts: {todayPosts}</span>
                <span>Total Posts: {posts.length}</span>
                <span>Active Posts: {activePosts}</span>
                <span>Deleted Posts: {deletedPosts}</span>
              </div>
            </div>
          </div>
          <div className="actions">
            <button 
              className={`toggle-deleted ${showDeleted ? 'active' : ''}`}
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? 'Hide Deleted Posts' : 'Show Deleted Posts'}
            </button>
            <button className="back-button" onClick={() => navigate("/admin")}>
              Back to Admin Portal
            </button>
          </div>
        </div>

        <div className="posts">
          {filteredPosts.length === 0 ? (
            <p className="no-posts">No posts found</p>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className={`post-card ${post.deletedAt ? 'deleted' : ''}`}>
                <div className="image">
                  <img src={post.images?.[0] || '/no-image.jpg'} alt={post.title} />
                </div>
                <div className="content">
                  <h2>{post.title}</h2>
                  <p className="price">$ {post.price}</p>
                  <p className="address">
                    <img src="/pin.png" alt="" />
                    <span>{post.address}</span>
                  </p>
                  <div className="features">
                    <div className="feature">
                      <img src="/bed.png" alt="" />
                      <span>{post.bedroom} bedroom</span>
                    </div>
                    <div className="feature">
                      <img src="/bath.png" alt="" />
                      <span>{post.bathroom} bathroom</span>
                    </div>
                  </div>
                  <div className="actions">
                    {!post.deletedAt && (
                      <button 
                        className="edit"
                        onClick={() => handleEditPost(post.id)}
                      >
                        Edit Post
                      </button>
                    )}
                    {!post.deletedAt ? (
                      <button 
                        className="delete"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete Post
                      </button>
                    ) : (
                      <button 
                        className="restore"
                        onClick={() => handleRestorePost(post.id)}
                      >
                        Restore Post
                      </button>
                    )}
                    <button 
                      className="view"
                      onClick={() => navigate(`/${post.id}?showDeleted=true`)}
                    >
                      View Post
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPosts; 