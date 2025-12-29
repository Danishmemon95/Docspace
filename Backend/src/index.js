import express from "express";
import dotenv from "dotenv";
import connectDb from "./db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./Routes/authRoutes.js";
import categoryRoutes from "./Routes/categoryRoutes.js";
import noteRoutes from "./Routes/noteRoutes.js";

dotenv.config();
const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/note", noteRoutes);
app.use("/api/category", categoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDb();
});
