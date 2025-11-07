import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";

import { HttpError } from "./errors/httpErrors";
import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import statsRoutes from "./routes/statsRoutes";
import connectDB from "./utils/db";
import { statsMiddleware } from "./middleware/stats";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(statsMiddleware);

const clientPath = path.join(__dirname, "..", "..", "client");
app.use(express.static(clientPath));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stats", statsRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);

    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
  },
);

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
