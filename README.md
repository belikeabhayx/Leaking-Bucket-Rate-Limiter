# Distributed Leaky Bucket Rate Limiter

An industrial-grade, distributed Leaky Bucket rate limiter built from scratch in Next.js 16 and TypeScript, following strict Hexagonal Architecture (Ports & Adapters) principles.

Includes a real-time visualization dashboard supporting both Local Simulation and Live Next.js API Mode with Redis backing.

---

## 🏛️ Architectural Hierarchy

This codebase adheres to clean hexagonal boundary isolation:

```
src/
├── domain/                  # Core Business Rules (Zero dependencies)
│   ├── types/               # Nominal/Branded types & Result pattern
│   ├── errors/              # Discriminated union errors
│   └── bucket/              # Leaky Bucket pure functions
├── lib/                     # Infrastructure/Adapters
│   ├── storage/             # Memory and Redis Lua storage adapters
│   ├── clock/               # Clock abstraction (System & Manual testing clocks)
│   └── config/              # Boundary validation & environment parsers
├── services/                # Use-Case Orchestrator (Orchestration layer)
│   └── rate-limiter.ts      # Sequences get -> consume -> set flow
├── app/                     # Next.js App Router (HTTP boundary)
│   └── api/rate-limit/      # POST (consume) & GET (inspect) endpoints
└── components/              # Frontend Visualization Dashboard
    └── dashboard/           # SVG rendering, telemetry hooks, logs
```

### Dependency Rules:
```
components ──> services ──> domain <── lib
```
- The **Domain Layer** has zero runtime dependencies and is fully isolated.
- The **Infrastructure Layer** (adapters) implements interfaces defined by the application.
- The **Service Layer** coordinates operations. No direct dependency exists between HTTP controllers and database/network clients.

---

## 🧮 Pure Algorithm & Mathematical Flow

The Leaky Bucket algorithm models traffic rate-limiting like a bucket filled with water leaking at a constant rate:
1. **Water Level**: Represents currently active/un-leaked requests.
2. **Capacity**: The maximum burst size allowed.
3. **Leak Rate**: The rate at which the bucket drains (units per millisecond).

### Calculations

When a request arrives at timestamp $t_{\text{now}}$:
$$\text{elapsedMs} = t_{\text{now}} - t_{\text{lastLeak}}$$
$$\text{leakedUnits} = \text{elapsedMs} \times \text{leakRatePerMs}$$
$$\text{currentWaterLevel} = \max(0, \text{waterLevel} - \text{leakedUnits})$$

If $\text{currentWaterLevel} + \text{requestedUnits} > \text{Capacity}$, the request is **blocked** ($429$ Too Many Requests). The minimum time the client must wait before retrying is calculated as:
$$\text{retryAfterMs} = \lceil \frac{(\text{currentWaterLevel} + \text{requestedUnits}) - \text{Capacity}}{\text{leakRatePerMs}} \rceil$$

---

## ⚡ Distributed Scalability (Redis Lua Scripting)

In a distributed environment, multi-node setups face write-write race conditions when reading and writing states sequentially. This codebase resolves this using an atomic Redis Lua script:

```lua
local raw = redis.call('GET', KEYS[1])
local waterLevel = 0
local lastLeakTimestamp = tonumber(ARGV[2])
if raw then
  local data = cjson.decode(raw)
  waterLevel = data.waterLevel
  lastLeakTimestamp = data.lastLeakTimestamp
end
local now = tonumber(ARGV[2])
local elapsedMs = now - lastLeakTimestamp
local leakRatePerMs = tonumber(ARGV[4])
local capacity = tonumber(ARGV[3])
local units = tonumber(ARGV[1])
if elapsedMs > 0 then
  local leaked = elapsedMs * leakRatePerMs
  waterLevel = math.max(0, waterLevel - leaked)
end
local newLevel = waterLevel + units
if newLevel > capacity then
  local overflow = newLevel - capacity
  local retryAfterMs = math.ceil(overflow / leakRatePerMs)
  return {0, waterLevel, capacity, retryAfterMs}
end
local payload = cjson.encode({
  waterLevel = newLevel,
  lastLeakTimestamp = now,
  capacity = capacity,
  leakRatePerMs = leakRatePerMs
})
redis.call('SET', KEYS[1], payload, 'EX', tonumber(ARGV[5]))
return {1, newLevel, capacity, 0}
```

This Lua script guarantees **indivisible execution** on Redis's single-threaded event loop, preventing capacity bypasses across horizontally-scaled API servers.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 22 or higher
- Docker (optional, for Redis)

### 2. Environment Setup
Copy `.env.example` to `.env.local` to override default settings:
```bash
cp .env.example .env.local
```

### 3. Local Development
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to interact with the dashboard.

---

## 🧪 Testing Suite

We use Node's native test runner paired with `tsx` for type execution. Time is controlled deterministically using the `ManualClock` injection pattern.

Run all tests:
```bash
npm test
```

Test coverage includes:
- Pure leak math decay boundaries.
- Clock skew protection.
- Correct `retryAfterMs` calculations.
- Level accumulation for sequential requests.

---

## 🐳 Docker Deployment

The application includes a production-grade multi-stage `Dockerfile` and a compose stack that mounts Next.js (standalone build) with a healthy Redis Alpine instance:

```bash
docker compose up --build
```
This binds Next.js on port `3000` and Redis on `6379` with a named volume mapping for persistent state.

