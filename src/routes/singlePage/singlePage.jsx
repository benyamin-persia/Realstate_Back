import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useNavigate, useLoaderData } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function SinglePage() {
  const post = useLoaderData();
  const [saved, setSaved] = useState(post.isSaved);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/login");
    }
    // AFTER REACT 19 UPDATE TO USEOPTIMISTIK HOOK
    setSaved((prev) => !prev);
    try {
      await apiRequest.post("/users/save", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || currentUser.id !== post.userId) {
      return;
    }

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await apiRequest.delete(`/posts/${post.id}`);
        navigate("/list");
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post. Please try again.");
      }
    }
  };

  const handleEdit = () => {
    if (!currentUser || currentUser.id !== post.userId) {
      return;
    }
    navigate(`/add?edit=${post.id}`);
  };

  const handleChat = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      console.log("Post data:", post); // Debug log
      console.log("Post user:", post.user); // Debug log
      
      // Check if chat already exists
      const existingChats = await apiRequest.get("/chats");
      const existingChat = existingChats.data.find(
        (chat) => chat.userIDs.includes(post.user.id)
      );

      if (existingChat) {
        // If chat exists, navigate to profile page with chat open
        navigate("/profile", { state: { openChat: existingChat.id } });
      } else {
        // Create new chat
        console.log("Creating chat with receiverId:", post.user.id); // Debug log
        const response = await apiRequest.post("/chats", {
          receiverId: post.user.id,
        });
        
        if (response.data) {
          // Navigate to profile page with new chat open
          navigate("/profile", { state: { openChat: response.data.id } });
        } else {
          throw new Error("No chat data received from server");
        }
      }
    } catch (err) {
      console.error("Error initializing chat:", err);
      console.error("Error details:", err.response?.data); // Debug log
      // Show error message to user
      alert(err.response?.data?.message || "Failed to initialize chat. Please try again.");
    }
  };

  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={post.images} />
          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{post.address}</span>
                </div>
                <div className="price">$ {post.price}</div>
                {currentUser && currentUser.id === post.userId && (
                  <div className="owner-actions">
                    <button onClick={handleEdit} className="edit-btn">
                      <img src="/edit.png" alt="" />
                      Edit Post
                    </button>
                    <button onClick={handleDelete} className="delete-btn">
                      <img src="/delete.png" alt="" />
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
              <div className="user">
                <img src={post.user.avatar} alt="" />
                <span>{post.user.username}</span>
              </div>
            </div>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.postDetail.desc),
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <p className="title">General</p>
          <div className="listVertical">
            <div className="feature">
              <img src="/property.png" alt="" />
              <div className="featureText">
                <span>Property Type</span>
                <p>{post.property === "AKHUND" ? "آخوند" :
                    post.property === "AFGHANI" ? "افغانی" :
                    post.property === "AFGHAN_MAL" ? "افغان مال" :
                    post.property === "SEPAHI" ? "سپاهی" :
                    post.property === "BASIJI" ? "بسیجی" :
                    post.property === "PAN_TURK" ? "پان ترک" :
                    post.property === "PAN_KURD" ? "پان کرد" :
                    post.property === "PAN_ARAB" ? "پان عرب" :
                    post.property === "SARKOOBGAR" ? "سرکوبگر" :
                    post.property === "AGHAZADE" ? "آقازاده" :
                    post.property}</p>
              </div>
            </div>
            <div className="feature">
              <img src="/utility.png" alt="" />
              <div className="featureText">
                <span>Utilities</span>
                {post.postDetail.utilities === "owner" ? (
                  <p>Owner is responsible</p>
                ) : (
                  <p>Tenant is responsible</p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Pet Policy</span>
                {post.postDetail.pet === "allowed" ? (
                  <p>Pets Allowed</p>
                ) : (
                  <p>Pets not Allowed</p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Income Policy</span>
                <p>{post.postDetail.income}</p>
              </div>
            </div>
          </div>
          <p className="title">Sizes</p>
          <div className="sizes">
            <div className="size">
              <img src="/size.png" alt="" />
              <span>{post.postDetail.size} sqft</span>
            </div>
            <div className="size">
              <img src="/bed.png" alt="" />
              <span>{post.bedroom} beds</span>
            </div>
            <div className="size">
              <img src="/bath.png" alt="" />
              <span>{post.bathroom} bathroom</span>
            </div>
          </div>
          <p className="title">Nearby Places</p>
          <div className="listHorizontal">
            <div className="feature">
              <img src="/school.png" alt="" />
              <div className="featureText">
                <span>School</span>
                <p>
                  {post.postDetail.school > 999
                    ? post.postDetail.school / 1000 + "km"
                    : post.postDetail.school + "m"}{" "}
                  away
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Bus Stop</span>
                <p>{post.postDetail.bus}m away</p>
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Restaurant</span>
                <p>{post.postDetail.restaurant}m away</p>
              </div>
            </div>
          </div>
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[post]} />
          </div>
          <div className="buttons">
            <button onClick={handleChat}>
              <img src="/chat.png" alt="" />
              Send a Message
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: saved ? "#fece51" : "white",
              }}
            >
              <img src="/save.png" alt="" />
              {saved ? "Place Saved" : "Save the Place"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
