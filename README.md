# middleware-demo
Practical-12
# ⚙️ Middleware Pipeline Demo

A simple Node.js + Express demo showing how middleware order matters.

---

##  Features
- `X-Request-Id` and `X-Response-Time-ms` headers on every response
- Body size limit + safe JSON parsing
- CORS with whitelist check
- Schema validation per route
- Centralized RFC-7807 error handler
- Handles async errors (no unhandled rejections)

---

##  Project Structure
middleware-demo/
├── middleware-demo.js
└── package.json

##  Setup

```bash
npm install
node middleware-demo.js

```
## Test Example
curl -H "Origin: http://allowed.example" -H "Content-Type: application/json" \
     -d '{"name":"apple","qty":5}' http://localhost:3000/items
