# Leaky Bucket Rate Limiter

An industrial-grade implementation of the Leaky Bucket algorithm built from scratch.

## Architecture

This project follows Hexagonal Architecture (Ports & Adapters).

```
src/
├── domain/      # Pure business logic — no external dependencies
│   ├── types/   # Brand types and value objects
│   ├── errors/  # Domain error hierarchy
│   └── bucket/  # Leaky bucket algorithm (pure functions)
├── lib/         # Infrastructure adapters
│   ├── storage/ # Memory and Redis storage adapters
│   ├── clock/   # System clock abstraction
│   └── config/  # Configuration parsing and validation
├── services/    # Use-case orchestrators
├── app/         # Next.js App Router (API + pages)
└── components/  # React dashboard
```

## Dependency Rule

```
components → services → domain ← lib
```

The domain layer has zero runtime dependencies.
Adapters implement interfaces defined in the domain.

## Stack

- Next.js 16 / React 19
- TypeScript (strict)
- Redis (via ioredis)
- Tailwind CSS v4

## Getting Started

```bash
npm run dev
```
