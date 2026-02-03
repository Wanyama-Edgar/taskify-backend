import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todos.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // puts the requested data in req.body
app.use(cookieParser());

app.use("/todos", todoRoutes);
app.use("/auth", authRoutes);

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is healthy" });
});

const PORT = process.env.PORT || 5000;

app.listen(5000, () => {
  console.log(`Server is listening on port ${PORT}`);
});
