import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import morgan from "morgan";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (env.nodeEnv === "development") app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .catch((err) => {
    console.error("Failed to initialize database connection:", err.message);
  })
  .finally(() => {
    app.listen(env.port, () => console.log(`Server running on http://localhost:${env.port}`));
  });
