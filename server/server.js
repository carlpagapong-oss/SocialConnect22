import express from "express";
import cors from "cors";
import morgan from "morgan";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
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
