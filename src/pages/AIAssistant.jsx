
import { useState } from "react";

const suggestedQuestions = [
  "Give me a complete business summary",
  "Why is my finance balance negative?",
  "Show me my sales performance",
  "What should I check in inventory?",
];

function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (userQuestion) => {
    if (!userQuestion.trim() || loading) return;

    const currentQuestion = userQuestion.trim();

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { type: "user", text: currentQuestion },
    ]);
    setQuestion("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login again. Authentication token is missing.");
      }

      const response = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentQuestion,
        }),
      });

      // Read the response as text first.
      const responseText = await response.text();

      // Safely parse the JSON response.
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "AI API returned a non-JSON response:",
          responseText
        );

        throw new Error(
          `The server returned HTML instead of JSON (HTTP ${response.status}). Check the API URL and backend server.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Request failed (${response.status})`
        );
      }

      if (!data.success) {
        throw new Error(
          data.message || data.error || "AI request failed."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: data.reply || "No response received from AI.",
        },
      ]);
    } catch (error) {
      console.error("AI Assistant Error:", error);

      let errorMessage = error.message || "Something went wrong.";

      if (
        errorMessage.includes("401") ||
        errorMessage.toLowerCase().includes("token")
      ) {
        errorMessage =
          "Your login session may have expired. Please login again.";
      } else if (
        errorMessage.includes("403")
      ) {
        errorMessage =
          "You do not have permission to access the AI Assistant.";
      } else if (
        errorMessage.includes("429")
      ) {
        errorMessage =
          "AI request limit reached. Please wait and try again.";
      } else if (
        errorMessage.includes("503") ||
        errorMessage.toLowerCase().includes("high demand") ||
        errorMessage.toLowerCase().includes("unavailable")
      ) {
        errorMessage =
          "Gemini AI is temporarily unavailable. Please try again later.";
      } else if (
        errorMessage.toLowerCase().includes("failed to fetch")
      ) {
        errorMessage =
          "Backend server is not connected. Start the backend on port 5000.";
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion(question);
  };

  const disabledSend = loading || !question.trim();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, color: "#1f2937" }}>
        AI Business Assistant
      </h1>

      <p style={{ color: "#6b7280", marginBottom: 25 }}>
        Ask questions about your business data and get AI-powered insights.
      </p>

      {/* Suggested Questions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 25,
        }}
      >
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => askQuestion(item)}
            disabled={loading}
            style={{
              padding: 14,
              border: "1px solid #dbe1ea",
              borderRadius: 10,
              background: loading ? "#f3f4f6" : "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              textAlign: "left",
              color: "#374151",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 15,
          padding: 20,
          minHeight: 400,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          marginBottom: 20,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 100,
              color: "#9ca3af",
            }}
          >
            <h2>👋 Hello!</h2>
            <p>Ask me anything about your business.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  message.type === "user" ? "flex-end" : "flex-start",
                marginBottom: 15,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "13px 16px",
                  borderRadius: 12,
                  background:
                    message.type === "user" ? "#2563eb" : "#f1f5f9",
                  color:
                    message.type === "user" ? "#ffffff" : "#1f2937",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  overflowWrap: "anywhere",
                }}
              >
                {message.text}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={{ color: "#6b7280", padding: 10 }}>
            🤖 AI is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 10 }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about your business..."
          disabled={loading}
          style={{
            flex: 1,
            padding: 15,
            border: "1px solid #d1d5db",
            borderRadius: 10,
            outline: "none",
            fontSize: 15,
          }}
        />

        <button
          type="submit"
          disabled={disabledSend}
          style={{
            padding: "15px 25px",
            border: "none",
            borderRadius: 10,
            background: disabledSend ? "#9ca3af" : "#2563eb",
            color: "#ffffff",
            cursor: disabledSend ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Processing..." : "Ask AI"}
        </button>
      </form>
    </div>
  );
}

export default AIAssistant;

