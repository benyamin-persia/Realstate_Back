import { Link, useNavigate } from "react-router-dom";
import "./card.scss";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function Card({ item }) {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log("Card received item:", item);

  const handleChat = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      console.log("Item data:", item); // Debug log
      console.log("User data:", item.user); // Debug log
      
      if (!item.user || !item.user.id) {
        throw new Error("Post user data is missing");
      }

      // Check if chat already exists
      console.log("Checking existing chats..."); // Debug log
      const existingChats = await apiRequest.get("/chats");
      console.log("Existing chats:", existingChats.data); // Debug log
      
      const existingChat = existingChats.data.find(
        (chat) => chat.userIDs.includes(item.user.id)
      );
      console.log("Found existing chat:", existingChat); // Debug log

      if (existingChat) {
        // If chat exists, navigate to profile page with chat open
        navigate("/profile", { state: { openChat: existingChat.id } });
      } else {
        // Create new chat
        console.log("Creating new chat with receiverId:", item.user.id); // Debug log
        const response = await apiRequest.post("/chats", {
          receiverId: item.user.id,
        });
        console.log("Chat creation response:", response.data); // Debug log
        
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
      console.error("Error status:", err.response?.status); // Debug log
      alert(err.response?.data?.message || "Failed to initialize chat. Please try again.");
    }
  };

  return (
    <div className="card">
      <Link to={`/${item.id}`} className="imageContainer">
        <img src={item.images[0]} alt="" />
      </Link>
      <div className="textContainer">
        <h2 className="title">
          <Link to={`/${item.id}`}>{item.title}</Link>
        </h2>
        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address}</span>
        </p>
        <p className="price">$ {item.price}</p>
        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{item.bedroom} bedroom</span>
            </div>
            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{item.bathroom} bathroom</span>
            </div>
          </div>
          <div className="owner">
            <img src={item.user?.avatar || "/noavatar.jpg"} alt="" />
            <span>{item.user?.username}</span>
          </div>
          <div className="icons">
            <div className="icon">
              <img src="/save.png" alt="" />
            </div>
            <div className="icon" onClick={handleChat}>
              <img src="/chat.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
