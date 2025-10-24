
import express from "express";
import crypto from "crypto";
import { URL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_BODY_LIMIT = "2kb";
const CORS_WHITELIST = new Set([
  "http://localhost:4000",
  "http://allowed.example"
]);

// Handle unhandled rejections globally
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);

  const start = process.hrtime.bigint();

  const originalEnd = res.end;
  res.end = function (...args) {
    const diff = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader("X-Response-Time-ms", diff.toFixed(3));
    return originalEnd.apply(this, args);
  };

  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  try {
    const o = new URL(origin);
    if (CORS_WHITELIST.has(o.origin)) {
      res.setHeader("Access-Control-Allow-Origin", o.origin);
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") return res.sendStatus(204);
      return next();
    } else {
      return next(problem(403, "CORS Rejected", `Origin ${origin} not allowed`));
    }
  } catch {
    return next(problem(400, "Bad Origin", "Malformed Origin header"));
  }
});

app.use(express.json({ limit: JSON_BODY_LIMIT }));

function validateItem(req, res, next) {
  const body = req.body;
  if (typeof body.name !== "string")
    return next(problem(422, "Invalid name", "name must be a string"));
  if (typeof body.qty !== "number")
    return next(problem(422, "Invalid qty", "qty must be a number"));
  next();
}

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <h2>✅ Middleware Pipeline Demo is Running</h2>
    <p>This server demonstrates ordered middleware execution.</p>
    <p>Try sending a <code>POST /items</code> request with JSON body.</p>
    <pre>{
  "name": "apple",
  "qty": 5
}</pre>
    <p>All responses include <code>X-Request-Id</code> and <code>X-Response-Time-ms</code>.</p>
  `);
});
app.post("/items", validateItem, async (req, res, next) => {
  try {
    // simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.json({ ok: true, item: req.body });
  } catch (err) {
    next(problem(500, "Internal Error", err.message));
  }
});

function problem(status, title, detail) {
  const err = new Error(title);
  err.problem = { type: "about:blank", title, status, detail };
  return err;
}
app.use((err, req, res, next) => {
  const p = err.problem || {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: err.message || "Unknown error"
  };

  res.status(p.status);
  res.setHeader("Content-Type", "application/problem+json");
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("X-Response-Time-ms", res.getHeader("X-Response-Time-ms") || "0");
  res.json(p);
});
                                                          
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
