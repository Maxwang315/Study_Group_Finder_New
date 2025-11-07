import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import statsRoutes from "./routes/statsRoutes";
import connectDB from "./utils/db";
import { statsMiddleware } from "./middleware/stats";
import { errorHandler } from "./middleware/errorHandler";
import { config } from "./config/env";

const app = express();

app.set("trust proxy", config.server.trustProxy);

const allowedOrigins = config.server.clientOrigins;

if (config.environment.isProduction && allowedOrigins.length === 0) {
  console.warn(
    "No CLIENT_ORIGINS configured; CORS requests will be rejected in production. Set CLIENT_ORIGINS to allow browser access.",
  );
}

const hasWildcardMatch = (origin: string, patterns: string[]): boolean =>
  patterns.some((pattern) => {
    if (!pattern.includes("*")) {
      return false;
    }

    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`);
    return regex.test(origin);
  });

const isOriginAllowed = (origin: string): boolean =>
  allowedOrigins.length === 0 ||
  allowedOrigins.includes(origin) ||
  hasWildcardMatch(origin, allowedOrigins);

const corsMiddleware: express.RequestHandler = (req, res, next) => {
  res.header("Vary", "Origin");

  const origin = req.header("Origin");

  if (!origin) {
    next();
    return;
  }

  const allowed = isOriginAllowed(origin);

  if (!allowed && req.method === "OPTIONS") {
    res.sendStatus(403);
    return;
  }

  if (!allowed) {
    console.warn(`Rejected CORS request from origin: ${origin}`);
    res.sendStatus(403);
    return;
  }

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    const requestHeaders = req.header("Access-Control-Request-Headers");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      requestHeaders ?? "Authorization,Content-Type,Accept,X-Requested-With",
    );
    res.sendStatus(204);
    return;
  }

  next();
};

const requestLogger = morgan(config.environment.isProduction ? "combined" : "dev");

const requestLimiter = rateLimit({
  windowMs: config.server.rateLimit.windowMinutes * 60 * 1000,
  max: config.server.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use(requestLimiter);
app.use(statsMiddleware);

app.use(express.static(config.server.staticAssetsPath));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stats", statsRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);

const port = config.server.port;

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
