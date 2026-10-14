import env from "../config/env.js";

export function notFound(req, _res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    statusCode = 409;
    message = `That ${field} is already taken`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id";
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    message,
    ...(env.nodeEnv === "development" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
