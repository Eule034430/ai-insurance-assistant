import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function App() {
  // Our chat history: an array of { role, message } objects
  const [history, setHistory] = useState([]);

  // What the user is typing right now
  const [input, setInput] = useState("");

  // Handy ref to scroll to the bottom when new messages arrive
  const endRef = useRef(null);

  // Pull in the port from our .env via Vite
  const PORT = import.meta.env.VITE_PORT;

  // When the component first appears, grab Tina’s opening line
  useEffect(() => {
    axios
      .post(`http://localhost:${PORT}/insurance`, {
        userResponse: "",
        chatHistory: [],
      })
      .then((res) => {
        // Strip out any leftover “Tina:” prefix and save
        const ai = res.data.response.replace(/Tina:/g, "").trim();
        setHistory([{ role: "assistant", message: ai }]);
      })
      .catch(console.error);
  }, []);

  // Keep the view scrolled to the latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Called when the user hits Enter or clicks Send
  const handleSubmit = async () => {
    // Add the user’s new line to our history
    const updatedHistory = [...history, { role: "user", message: input }];

    try {
      const res = await axios.post(`http://localhost:${PORT}/insurance`, {
        userResponse: input,
        chatHistory: updatedHistory,
      });

      // Clean up Tina’s reply and append it
      const rawAI = res.data.response;
      const aiResponse = rawAI.replace(/Tina:/g, "").trim();

      setHistory([
        ...updatedHistory,
        { role: "assistant", message: aiResponse },
      ]);
      setInput(""); // clear the input box
    } catch (error) {
      console.error("Error from server:", error);
    }
  };

  return (
    <div className="chat-container">
      <h1>Tina - Your AI Insurance Policy Assistant</h1>

      <div className="messages">
        {history.map((msg, idx) => {
          // Show "Tina:" instead of "Assistant:", but leave user as "User:"
          const label =
            msg.role === "assistant"
              ? "Tina"
              : msg.role.charAt(0).toUpperCase() + msg.role.slice(1);

          return (
            <div key={idx} className={`message-bubble ${msg.role}`}>
              <strong>{label}: </strong>
              <ReactMarkdown>{msg.message}</ReactMarkdown>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Type your answer..."
        />
        <button onClick={handleSubmit}>Send</button>
      </div>
    </div>
  );
}
