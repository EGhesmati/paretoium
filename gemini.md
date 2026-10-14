# Gemini API Integration & Model Guidelines

This document outlines the operational rules, implementation roadmap, and environment configuration for the Gemini API integration in the Course Path Optimizer project.

---

## 1. Core Operating Principles

- **Package Choice**: Use `@ai-sdk/google` for standard model integration.
- **Model Selection**: Always use a Gemini Flash model variant (e.g., `gemini-1.5-flash` or `gemini-2.0-flash`) to ensure low latency and stay well within free-tier rate limits.
- **Environment Variables**: Never hardcode model IDs in code. Always load the model string dynamically via the `GEMINI_MODEL_ID` environment variable.
- **Caching & Efficiency**:
  - Cache all generated AI responses in PostgreSQL/Prisma DB to avoid redundant API calls and prevent hit limits during demo runs.
  - Pre-generate node summaries and quizzes for common curriculum items ahead of demo presentations.
- **Rate Limit & Error Handling**: Implement fallback logic and explicit handling for rate limits (HTTP 429).

---

## 2. Implementation Roadmap

- **Day 28**: Initial `@ai-sdk/google` setup and implementation of the `/api/node-summary` endpoint.
- **Day 29**: Implementation of the `/api/quiz-generation` API route.
- **Day 30**: Add rate-limiting, error fallback handling, and database caching layer.
- **Day 42**: Integrate AI node summaries and quizzes directly into the React Flow sliding node detail drawer.

---

## 3. Environment Variables Spec

```env
# Server-side Next.js environment configuration
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL_ID="gemini-1.5-flash"
```

