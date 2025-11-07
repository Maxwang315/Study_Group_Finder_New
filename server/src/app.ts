import express from "express";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const clientPath = path.join(__dirname, "..", "..", "client");
app.use(express.static(clientPath));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;
