import { useContext, useState, useEffect } from "react";
import "./adminPage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPostCounts, setUserPostCounts] = useState({});

  // Calculate user statistics
  const userStats = {
    total: users.length,
    premium: users.filter(user => user.role === 'premium' && !user.isAdmin).length,
    regular: users.filter(user => user.role === 'regular' && !user.isAdmin).length,
    admin: users.filter(user => user.isAdmin).length
  };

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/");
      return;
    }

    // Fetch users and their post counts
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest.get("/users");
        console.log("Fetched users:", response.data);
        setUsers(response.data);
        
        // Fetch post counts for each user
        const postCounts = {};
        for (const user of response.data) {
          try {
            const postsResponse = await apiRequest.get(`/users/${user.id}/posts`);
            console.log(`Posts for user ${user.username}:`, postsResponse.data.length);
            postCounts[user.id] = postsResponse.data.length;
          } catch (err) {
            console.error(`Failed to fetch posts for user ${user.id}:`, err);
            postCounts[user.id] = 0;
          }
        }
        console.log("Post counts:", postCounts);
        setUserPostCounts(postCounts);
      } catch (err) {
        console.error("Error fetching users:", err);
        if (err.response?.status === 403) {
          setError("You don't have permission to access the admin portal");
          navigate("/");
        } else {
          setError(err.response?.data?.message || "Failed to fetch users. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError(null);
      await apiRequest.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error("Error updating user role:", err);
      setError(err.response?.data?.message || "Failed to update user role");
    }
  };

  const handlePostLimitChange = async (userId, newLimit) => {
    try {
      setError(null);
      await apiRequest.put(`/users/${userId}/post-limit`, { postLimit: newLimit });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, postLimit: newLimit } : user
      ));
    } catch (err) {
      console.error("Error updating post limit:", err);
      setError(err.response?.data?.message || "Failed to update post limit");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setError(null);
      await apiRequest.delete(`/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="adminPage">
      <div className="wrapper">
        <h1>Admin Portal</h1>
        <div className="stats">
          <div className="stat">
            <h2>Total Users</h2>
            <span>{userStats.total}</span>
            <p className="stat-detail">
              {userStats.admin} Admin, {userStats.premium} Premium, {userStats.regular} Regular
            </p>
          </div>
          <div className="stat">
            <h2>Premium Users</h2>
            <span>{userStats.premium}</span>
            <p className="stat-detail">
              {userStats.total > 0 ? ((userStats.premium / userStats.total) * 100).toFixed(1) : 0}% of total users
            </p>
          </div>
          <div className="stat">
            <h2>Regular Users</h2>
            <span>{userStats.regular}</span>
            <p className="stat-detail">
              {userStats.total > 0 ? ((userStats.regular / userStats.total) * 100).toFixed(1) : 0}% of total users
            </p>
          </div>
        </div>

        <div className="userManagement">
          <h2>User Management</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Post Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.isAdmin ? "admin-row" : ""}>
                  <td>
                    {user.username}
                    {user.isAdmin && <span className="admin-badge">Admin</span>}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.isAdmin ? (
                      <div className="admin-role">
                        <span>Admin</span>
                        <span className="admin-tooltip">Admin role cannot be changed</span>
                      </div>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="regular">Regular</option>
                        <option value="premium">Premium</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {user.isAdmin ? (
                      <div className="admin-limit">
                        <span>Unlimited</span>
                        <span className="admin-tooltip">Admin post limit cannot be changed</span>
                      </div>
                    ) : (
                      <select
                        value={user.postLimit}
                        onChange={(e) => handlePostLimitChange(user.id, parseInt(e.target.value))}
                        disabled={user.role === 'premium'}
                      >
                        <option value="3">3 posts/day</option>
                        <option value="5">5 posts/day</option>
                        <option value="10">10 posts/day</option>
                        <option value="-1">Unlimited</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      {!user.isAdmin && (
                        <button onClick={() => handleDeleteUser(user.id)} className="delete">
                          Delete
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/admin/user/${user.id}/posts`)} 
                        className="view-posts"
                      >
                        View Posts ({userPostCounts[user.id] || 0})
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage; 