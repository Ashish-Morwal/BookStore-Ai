const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Middleware

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://book-store-app-frontend-eta.vercel.app",
    ],
    credentials: true,
  })
);
const chatbotRoutes = require("./src/chatbot/chatbot.route");
app.use("/api/chatbot", chatbotRoutes);

// ✅ Routes
const bookRoutes = require("./src/books/book.route");
const orderRoutes = require("./src/orders/order.route");
const userRoutes = require("./src/users/user.route");
const adminRoutes = require("./src/stats/admin.stats");

app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Root Route - This ensures "/" always works
app.get("/", (req, res) => {
  res.send("Book Store Server is running!");
});

// ✅ MongoDB Connection (Only logs when connected)
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Vercel doesn't need `app.listen`, so we export the app
module.exports = app;

// ✅ If running locally, start the server
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}
