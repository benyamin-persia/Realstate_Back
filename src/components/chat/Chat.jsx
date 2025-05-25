import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  const [isSending, setIsSending] = useState(false);

  const messageEndRef = useRef();
  const textareaRef = useRef();
  const decrease = useNotificationStore((state) => state.decrease);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    // Focus on textarea when chat is opened
    if (chat && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [chat]);

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest("/chats/" + id);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || isSending) return;

    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text?.trim()) return;

    setIsSending(true);
    try {
      const res = await apiRequest.post("/messages/" + chat.id, { text });
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      e.target.reset();
      textareaRef.current?.focus(); // Keep focus after sending message

      if (socket && isConnected) {
        socket.emit("sendMessage", {
          receiverId: chat.receiver.id,
          data: res.data,
        });
      } else {
        console.warn("Socket not connected, message sent but not delivered in real-time");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!chat || !socket || !isConnected) return;

    const handleNewMessage = (data) => {
      if (chat.id === data.chatId) {
        setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
        readChat();
      }
    };

    const readChat = async () => {
      try {
        await apiRequest.put("/chats/read/" + chat.id);
      } catch (err) {
        console.error("Error marking chat as read:", err);
      }
    };

    socket.on("getMessage", handleNewMessage);

    return () => {
      socket.off("getMessage", handleNewMessage);
    };
  }, [socket, chat, isConnected]);

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chats?.map((c) => (
          <div
            className="message"
            key={c.id}
            style={{
              backgroundColor:
                c.seenBy.includes(currentUser.id) || chat?.id === c.id
                  ? "white"
                  : "#fecd514e",
            }}
            onClick={() => handleOpenChat(c.id, c.receiver)}
          >
            <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
            <span>{c.receiver.username}</span>
            <p>{c.lastMessage}</p>
          </div>
        ))}
      </div>
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver.avatar || "noavatar.jpg"} alt="" />
              {chat.receiver.username}
            </div>
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.messages.map((message) => {
              const isOwnMessage = message.userId === currentUser.id;
              return (
                <div
                  className={`chatMessage ${isOwnMessage ? 'own' : ''}`}
                  key={message.id}
                >
                  <div className="messageContent">
                    <p>{message.text}</p>
                    <span>{format(message.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea 
              ref={textareaRef}
              name="text" 
              disabled={!isConnected || isSending}
              placeholder={!isConnected ? "Connecting..." : isSending ? "Sending..." : "Type a message..."}
            />
            <button disabled={!isConnected || isSending}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;
