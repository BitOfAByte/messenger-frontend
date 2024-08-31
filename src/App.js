import { useEffect, useRef, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import Login from "./Login";

function App() {
  const socket = useRef();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if there's a token in localStorage
    const storedToken = localStorage.getItem("jid");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      
      // Extract the username from the token
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      setUsername(payload.username); // Adjust this based on your token structure
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      socket.current = io("http://localhost:3001", {
        auth: { token },
      });
      
      socket.current.on("connect", () => {
        console.log("connected");
      });

      socket.current.on("new_message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [isLoggedIn, token]);

  const sendMessage = async (message) => {
    try {
      console.log("Sending message:", message);
      const response = await fetch("http://localhost:3001/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${data.message || "Unknown error"}`,
        );
      }

      console.log("Server response:", data.message);
    } catch (error) {
      console.error("Error sending message:", error.message);
      // Optionally, you could set an error state here to display to the user
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      sendMessage(query);
      setQuery("");
    }
  };

  const handleLoginSuccess = (token) => {
    setToken(token);
    setIsLoggedIn(true);

    // Extract username after login success
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUsername(payload.username);
  };

  return (
    <div className="App">
      <p>Socket.io app</p>
      {isLoggedIn ? (
        <>
          <p>Welcome, {username}!</p> {/* Display the username */}
          <form onSubmit={handleSubmit}>
            <input
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Send message</button>
          </form>
          <ul>
            {messages.map((msg, index) => {
              return <li key={index}>{username}: {msg}</li>;
            })}
          </ul>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
