const authRoutes = require("./routes/authRoutes");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); // calling the connection file
const portfolioRoutes = require("./routes/portfolioRoutes");
const githubRoutes = require("./routes/githubRoutes");


// Load variables from.env
dotenv.config();

const app = express();

// connect to db
connectDB();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5173",
    credentials: true,
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/github", githubRoutes);
// test server
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
