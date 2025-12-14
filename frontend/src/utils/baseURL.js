const baseURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://bookstore-ai-backend-am25.onrender.com";

export default baseURL;
