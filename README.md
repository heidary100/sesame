## Project Setup

```bash
npm install
```

---

## 🚀 Run the project with Docker (recommended)

This project includes a full Docker setup with:

* NestJS app container
* PostgreSQL database container
* Automatic database readiness check
* Hot-reload support (watch mode)

### 1. Create a `.env` file (if not existing)

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=appointments

PORT=3000
```

### 2. Start all services

```bash
docker compose up --build
```

### 3. Access the app

| Service                | URL                                                              |
| ---------------------- | ---------------------------------------------------------------- |
| API                    | [http://localhost:3000](http://localhost:3000)                   |
| Swagger Docs           | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| Postgres (for DBeaver) | Host: `localhost` — Port: `55432`                                |

### 4. Stop all services

```bash
docker compose down
```

If you want a clean rebuild (removes DB volume):

```bash
docker compose down --volumes --remove-orphans
```

---

## 🖥️ Run the project locally (without Docker)

Make sure you have PostgreSQL running locally if you run Nest outside Docker.

### Development

```bash
npm run start
```

### Watch mode (auto-reload)

```bash
npm run start:dev
```

### Production mode

```bash
npm run start:prod
```

---

## 🧪 Running Tests

### Unit tests

```bash
npm run test
```

### E2E tests

```bash
npm run test:e2e
```

### Test coverage

```bash
npm run test:cov
```

---

## Architectural Approaches for Consistency

This document outlines two potential architectural approaches for handling appointment creation/updates under high concurrency, focusing on consistency guarantees. The assignment emphasizes safe concurrent request handling, overlap detection, and immediate error feedback, which influences the choice.

### 1. Real-Time (Strong) Consistency Approach
This is a synchronous, transaction-based model using ACID properties of a relational database (e.g., PostgreSQL).

**Key Elements**:
- **Synchronous Processing**: Each POST request is handled immediately within a database transaction.
- **Concurrency Control**: Use pessimistic locking (e.g., `SELECT FOR UPDATE`) on the appointment row (by ID) or serializable isolation level to prevent race conditions. For overlap checks, query existing appointments atomically: `WHERE (start < new_end AND end > new_start) AND id != new_id`.
- **Error Handling**: Return errors (e.g., 409 for overlaps, 400 for invalid data) synchronously in the HTTP response.
- **History Tracking**: On update, insert the old version into a history table before upserting the new one – all within the same transaction.
- **Scaling**: Relies on database connection pooling. For higher loads, add read replicas for GET requests, but writes stay on the primary.

**Pros**:
- Immediate feedback to clients, aligning with RESTful principles and the assignment's "return an error message" requirement.
- Strong consistency: No temporary inconsistencies; GET always reflects committed state.
- Simpler implementation: No additional infrastructure like queues.
- Sufficient for the test script (10 parallel requests) and moderate production loads.

**Cons**:
- Potential lock contention under extreme loads could lead to timeouts (mitigated with transaction timeouts and optimized indexes).
- Less scalable horizontally without sharding (e.g., by organization ID).

This is the **straightforward method** chosen for the initial implementation, as it fits the assignment's scope (5-6 hours), simplicity, and sync requirements. It's production-ready for starter scales and easy to test/debug.

### 2. Eventual Consistency Approach
This is an asynchronous, distributed model using message queues for decoupling, suitable for ultra-high throughput.

**Key Elements**:
- **Asynchronous Processing**: Accept the request synchronously (return 202 Accepted), then queue it (e.g., via Kafka or RabbitMQ) for background workers to process.
- **Concurrency Control**: Workers use optimistic locking (e.g., version fields) or distributed locks (e.g., Redis). Overlap checks happen in workers; if conflict, notify via webhook or status endpoint.
- **Error Handling/Status**: Clients poll a status endpoint or receive async notifications for results.
- **History Tracking**: Workers handle inserts to history and main tables, using outbox pattern for reliability.
- **Scaling**: Use read replicas for GETs; queues allow horizontal scaling of workers.

**Pros**:
- High throughput: Decouples API from DB, reducing lock waits and handling bursts.
- Fault-tolerant: Queues retry failures; eventual consistency allows temporary read inconsistencies (resolved via eventual sync).
- Better for massive scale (e.g., if organizations grow large).

**Cons**:
- More complex: Requires queue setup, workers, and client-side polling/webhooks – adds time to implement.
- Potential inconsistencies: Clients might see stale data briefly, which could violate strict overlap rules.
- Mismatches assignment: Test script expects sync HTTP codes; async would need modifications.

This is the **more complex approach**. I'm proceeding with the real-time method for now to deliver a complete, testable solution within time constraints. However, if needed (e.g., for production scaling discussions), I can implement the eventual consistency model as an extension – let me know!
