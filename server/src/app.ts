import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import statsRoutes from "./routes/statsRoutes";
import connectDB from "./utils/db";
import { statsMiddleware } from "./middleware/stats";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

const requestLogger = morgan(process.env.NODE_ENV === "production" ? "combined" : "dev");

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use(requestLimiter);
app.use(statsMiddleware);

const clientPath = path.join(__dirname, "..", "..", "client");
app.use(express.static(clientPath));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stats", statsRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();

export default app;
