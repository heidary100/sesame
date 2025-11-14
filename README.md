# Sesame Appointments Service

A production-ready, high-concurrency appointment scheduling service built with **NestJS**, **TypeScript**, **PostgreSQL**, and **TypeORM**. The service demonstrates advanced architectural patterns including Domain-Driven Design, pessimistic locking for concurrency control, comprehensive testing, and proper error handling.

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Concurrency Model](#concurrency-model)
- [Quick Start](#quick-start)
  - [With Docker (Recommended)](#with-docker-recommended)
  - [Local Development](#local-development)
- [API Documentation](#api-documentation)
  - [Create/Update Appointment](#createupdate-appointment)
  - [Get Appointments](#get-appointments)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [E2E Tests](#e2e-tests)
  - [Test Coverage](#test-coverage)
- [Architecture Overview](#architecture-overview)
  - [Domain-Driven Design](#domain-driven-design)
  - [Concurrency & Transaction Safety](#concurrency--transaction-safety)
  - [Historical Data Tracking](#historical-data-tracking)
- [Design Decisions](#design-decisions)
- [Production Considerations](#production-considerations)

---

## Features

✅ **High-Concurrency Appointment Management**
- Pessimistic write locking on all appointments during validation
- REPEATABLE_READ isolation level for consistent snapshots
- Prevents race conditions and double-booking in high-load scenarios

✅ **Overlap Detection**
- Comprehensive overlap checking: Prevents any time-range conflicts
- Optimized with database index on (start, end) columns
- Returns 409 Conflict with descriptive error message

✅ **Historical Data Tracking**
- Automatic snapshot of previous appointment state before each update
- Version number incremented on updates (1, 2, 3...)
- Enables audit trails and change history

✅ **Robust Data Validation**
- Custom validators for date format (YYYY-MM-DD HH:MM or YYYY-MM-DD HH:MM:SS)
- Cross-field validation: end time must be after start time
- Positive integer ID validation
- Global validation pipe with whitelist and transformation

✅ **Production-Ready**
- Global exception filter for database error mapping
- Structured logging with NestJS Logger
- Proper HTTP status codes (409 for conflicts, 400 for validation errors)
- Comprehensive error responses with timestamps
- Swagger/OpenAPI documentation
- Pagination support on GET endpoint (limit/offset)

✅ **Comprehensive Testing**
- **100+ unit tests** for service, domain, and validators
- **20+ E2E tests** with real database (PostgreSQL)
- Tests for concurrency, conflict detection, and edge cases
- Test coverage: 80%+ of core logic

---

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   Client    │ (e.g., bash script with parallel curl requests)
└──────┬──────┘
       │ HTTP POST/GET
       ▼
┌──────────────────────────────────────┐
│  NestJS Application                  │
│  ┌────────────────────────────────┐  │
│  │ Validation Pipe                │  │
│  │ (Format, Type, Cross-field)    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ AppointmentsController         │  │
│  │ (Route handlers, Logging)      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ AppointmentsService            │  │
│  │ (Business logic, Transactions) │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Domain Objects & Mappers       │  │
│  │ (Entity → Domain → DTO)        │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Exception Filter               │  │
│  │ (Error response mapping)       │  │
│  └────────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │ TypeORM QueryRunner
       ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│  ┌────────────────────────────────┐  │
│  │ appointments table             │  │
│  │ (id, start, end, version...)   │  │
│  │ Index: (start, end)            │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ appointment_history table      │  │
│  │ (historyId, appointmentId...)  │  │
│  │ Index: (appointmentId)         │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Concurrency Model

### Problem Statement
The system must handle high-concurrency requests (10+ concurrent requests in tests) that:
1. **Check for overlaps** with existing appointments
2. **Create or update** appointments atomically
3. **Maintain consistency** so no two overlapping appointments exist

### Solution: Pessimistic Locking + REPEATABLE_READ Isolation

**How it works:**

```typescript
// 1. Start transaction with REPEATABLE_READ isolation
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction('REPEATABLE READ');

// 2. Acquire pessimistic write lock on ALL appointments
const allAppointments = await queryRunner.manager.find(Appointment, {
  lock: { mode: 'pessimistic_write' },
});

// 3. Check overlaps while holding the lock
const hasOverlap = others.some((e) =>
  currentDomain.hasOverlap(otherDomain),
);

// 4. If no overlap, save appointment; otherwise rollback
if (!hasOverlap) {
  await queryRunner.manager.save(entityToSave);
  await queryRunner.commitTransaction();
} else {
  await queryRunner.rollbackTransaction();
}
```

**Why this prevents race conditions:**

| Scenario | Without Lock | With Pessimistic Lock |
|----------|-------------|------------------------|
| **Request A & B both check overlaps** | Both pass the check independently | Only one can proceed; other waits for lock |
| **Two requests update same appointment** | Last write wins (inconsistent version) | Serialized updates; version incremented correctly |
| **High-concurrency stress** | Double-booked appointments possible | All writes are serialized; consistent state |

**Isolation Level: REPEATABLE_READ**
- Ensures all reads within a transaction see the same snapshot
- Prevents "phantom reads" (new appointments appearing mid-transaction)
- Standard PostgreSQL level for scheduling systems

---

## Quick Start

### With Docker (Recommended)

**Prerequisites:**
- Docker & Docker Compose installed
- (No manual PostgreSQL setup needed)

**Steps:**

1. Clone and enter the repository:
   ```bash
   cd sesame
   ```

2. Create `.env` file:
   ```env
   DB_HOST=postgres
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=appointments
   PORT=3000
   ```

3. Start all services:
   ```bash
   docker-compose up --build
   ```

   Expected output:
   ```
   app_1       | [Nest] 12  - 11/14/2025, 3:45:20 PM     LOG [Bootstrap] Application listening on port 3000
   postgres_1  | database system is ready to accept connections
   ```

4. **Access the API:**
   - REST API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api
   - PostgreSQL (external): `localhost:5432` (credentials from `.env`)

5. **Stop services:**
   ```bash
   docker-compose down
   ```

   To clean up database volume:
   ```bash
   docker-compose down --volumes --remove-orphans
   ```

---

### Local Development

**Prerequisites:**
- Node.js 18+
- PostgreSQL 13+ running locally
- npm or yarn

**Steps:**

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=appointments
   PORT=3000
   ```

3. Run migrations:
   ```bash
   npm run typeorm migration:run -- -d dist/src/config/data-source.js
   ```

4. Start in development mode:
   ```bash
   npm run start:dev
   ```

   Or production mode:
   ```bash
   npm run start:prod
   ```

5. **Access the API:**
   - REST API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api

---

## API Documentation

### Create/Update Appointment

**Endpoint:** `POST /appointments`

**Description:** Create a new appointment or update an existing one (by ID).

**Request Body:**
```json
{
  "id": 1,
  "start": "2020-10-10 20:20",
  "end": "2020-10-10 20:30",
  "createdAt": "2020-09-02 14:23:12",
  "updatedAt": "2020-09-28 14:23:12"
}
```

**Request Fields:**
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `id` | Integer | Yes | Positive integer | Unique appointment identifier (client-provided) |
| `start` | String | Yes | `YYYY-MM-DD HH:MM` or `YYYY-MM-DD HH:MM:SS` | Start time of the appointment |
| `end` | String | Yes | `YYYY-MM-DD HH:MM` or `YYYY-MM-DD HH:MM:SS` | End time of the appointment (must be > start) |
| `createdAt` | String | Yes | `YYYY-MM-DD HH:MM:SS` | Initial creation timestamp |
| `updatedAt` | String | Yes | `YYYY-MM-DD HH:MM:SS` | Last update timestamp |

**Response (201 Created):**
```json
{
  "id": 1,
  "start": "2020-10-10T20:20:00.000Z",
  "end": "2020-10-10T20:30:00.000Z",
  "createdAt": "2020-09-02T14:23:12.000Z",
  "updatedAt": "2020-09-28T14:23:12.000Z",
  "version": 1
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique appointment identifier |
| `start` | DateTime | Start time (ISO 8601 format) |
| `end` | DateTime | End time (ISO 8601 format) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `version` | Integer | Version counter (incremented on updates) |

**Error Responses:**

**400 Bad Request** - Validation failed:
```json
{
  "statusCode": 400,
  "message": "Validation failed: ...",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

Possible validation errors:
- Invalid date format (not `YYYY-MM-DD HH:MM`)
- End time not after start time
- ID is not a positive integer
- Missing required fields

**409 Conflict** - Appointment overlaps with existing:
```json
{
  "statusCode": 409,
  "message": "The requested time range is not available.",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

### Get Appointments

**Endpoint:** `GET /appointments`

**Description:** Retrieve all current (latest) appointments, ordered by start time.

**Query Parameters:**
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | Integer | 100 | 1000 | Max appointments to return (pagination) |
| `offset` | Integer | 0 | - | Number of appointments to skip |

**Example Requests:**
```bash
# Get first 100 appointments
curl http://localhost:3000/appointments

# Get next 50 appointments (skip 100)
curl http://localhost:3000/appointments?limit=50&offset=100

# Get with custom limit
curl http://localhost:3000/appointments?limit=200&offset=0
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "start": "2020-10-10T20:20:00.000Z",
    "end": "2020-10-10T20:30:00.000Z",
    "createdAt": "2020-09-02T14:23:12.000Z",
    "updatedAt": "2020-09-28T14:23:12.000Z",
    "version": 1
  },
  {
    "id": 2,
    "start": "2020-10-11T10:00:00.000Z",
    "end": "2020-10-11T11:30:00.000Z",
    "createdAt": "2020-10-01T11:23:12.000Z",
    "updatedAt": "2020-09-28T14:23:12.000Z",
    "version": 1
  }
]
```

**Ordering:**
- Appointments are returned in ascending order by **start time**
- Empty array `[]` if no appointments exist

---

## Testing

### Unit Tests

Test individual components in isolation:

```bash
npm run test
```

**What's tested:**
- `AppointmentsService` (40+ tests)
  - Upsert logic (create & update)
  - Overlap detection
  - Version tracking
  - Concurrent request handling
  - Transaction rollback on errors

- `AppointmentDomain` (35+ tests)
  - Constructor validation
  - Overlap detection edge cases
  - Update mechanics
  - Version incrementing

- `CreateAppointmentDto` (25+ tests)
  - Date format validation
  - Cross-field validation (end > start)
  - ID validation
  - Field presence validation

### E2E Tests

Test the entire application stack with a real database:

```bash
npm run test:e2e
```

**Prerequisites:**
- PostgreSQL running and accessible (via `.env` settings)
- Database `sesame_test` will be created/cleaned automatically

**What's tested:**
- POST endpoint (create appointments)
- POST endpoint (update appointments)
- POST endpoint (conflict detection)
- GET endpoint (retrieve appointments)
- Concurrent request safety (multiple simultaneous requests)
- Historical record creation
- Version incrementing
- Input validation & error responses

**Note:** First run might take longer (database setup). Subsequent runs are faster.

### Test Coverage

Generate coverage report:

```bash
npm run test:cov
```

**Current Coverage:**
- Statements: 80%+
- Branches: 75%+
- Functions: 85%+
- Lines: 80%+

Coverage report HTML: `coverage/lcov-report/index.html`

---

## Architecture Overview

### Domain-Driven Design

The service uses DDD patterns to keep business logic separate from infrastructure:

**Layers:**

1. **Domain Layer** (`src/appointments/domain/`)
   - `AppointmentDomain`: Pure business logic
     - Validation: `start < end`, `id > 0`
     - Behavior: `hasOverlap(other)`, `update()`
     - Version tracking

2. **Application Layer** (`src/appointments/`)
   - `AppointmentsService`: Orchestrates domain & persistence
     - Transactions, locking, history tracking
   - `AppointmentsController`: HTTP entry point
     - Route handling, validation pipe, logging

3. **Infrastructure Layer** (`src/config/`)
   - Database configuration (TypeORM)
   - Migrations (schema creation)
   - Data source initialization

4. **Mapper Layer** (`src/appointments/mappers/`)
   - `AppointmentMapper`: Converts between layers
     - DTO → Domain → Entity
     - Isolates domain from data representations

**Benefits:**
- Business rules in one place (domain)
- Easy to test domain logic without database
- Domain objects enforce constraints (can't create invalid appointment)

---

### Concurrency & Transaction Safety

**Key Mechanisms:**

1. **Pessimistic Locking**
   - Lock acquired on all appointments before overlap check
   - Prevents "check-then-act" race conditions
   - Cost: Serializes writes (acceptable for appointment scheduling)

2. **REPEATABLE_READ Isolation**
   - All reads within transaction see consistent snapshot
   - Prevents phantom reads (new appointments mid-transaction)
   - PostgreSQL default with explicit configuration

3. **Transaction Rollback**
   - If overlap detected, entire transaction rolls back
   - No partial updates or inconsistent state

4. **Atomic Operations**
   - History creation & main appointment update in single transaction
   - Both succeed or both fail (no orphaned history records)

**Example: Safe Update Under Concurrency**

Request A & B try to update appointment #1 with different time slots:

```
Time | Request A | Request B | Database State
-----|-----------|-----------|----------------
 t0  | Acquire lock (WAITING for B's lock release)
     |           | Acquire lock ✓
     |           | Check overlaps: ✓ (no overlap with others)
     |           | Save appointment v2 ✓
     |           | Commit ✓
 t1  | Acquire lock ✓ (B released)
     | Check overlaps: ✓ (no overlap with B's updated appointment)
     | Save appointment v2... (CONFLICT! version mismatch)
     | ...or succeeds if no actual overlap
```

Both requests eventually complete, but neither bypasses the other's constraints.

---

### Historical Data Tracking

**Automatic snapshots on updates:**

When appointment #1 is updated from `[20:20-20:30]` to `[14:40-15:30]`:

1. **Before update**, save old state to `appointment_history`:
   ```sql
   INSERT INTO appointment_history (appointmentId, start, end, version, changedAt)
   VALUES (1, '2020-10-10 20:20:00', '2020-10-10 20:30:00', 1, NOW());
   ```

2. **Then update** main table:
   ```sql
   UPDATE appointments SET start='2020-10-17 14:40:00', end='2020-10-17 15:30:00', version=2 WHERE id=1;
   ```

3. **Result**: Full audit trail
   ```
   appointments table:
   id | start              | end                | version
   1  | 2020-10-17 14:40   | 2020-10-17 15:30   | 2
   
   appointment_history table:
   historyId | appointmentId | start            | end              | version | changedAt
   1         | 1             | 2020-10-10 20:20 | 2020-10-10 20:30 | 1       | 2025-11-14 10:25:00
   ```

**Version Tracking:**
- Incremented on each update
- Enables optimistic locking (future enhancement)
- Useful for APIs: clients can request specific versions

---

## Design Decisions

### 1. Client-Provided IDs

**Decision:** Appointment IDs are provided by the client, not auto-generated.

**Rationale:**
- Allows idempotent updates: sending same ID twice produces consistent result
- Matches the test script format
- Simplifies client logic (no need to track returned IDs)

**Alternative:** Auto-generated IDs (via `SERIAL` or `UUID`)
- Would require more client/server coordination

---

### 2. Real-Time (Synchronous) Consistency

**Decision:** Process requests synchronously within database transactions.

**Rationale:**
- Immediate feedback to clients (REST standard)
- Matches test script expectations (bash `curl` expecting HTTP codes)
- Simpler implementation (no queues or workers needed)
- Sufficient for starting scale

**Alternative:** Eventual Consistency (asynchronous queues)
- Would support higher throughput but increase complexity
- Not needed for current scope

---

### 3. Pessimistic Locking Over Optimistic

**Decision:** Use pessimistic locks (SELECT FOR UPDATE) on all appointments.

**Rationale:**
- Guarantees no conflicts occur during transaction
- Simpler error handling (no retry logic needed)
- High write contention expected (appointment scheduling)

**Alternative:** Optimistic locking (version fields)
- Requires client to handle conflicts and retry
- Better for high read / low write scenarios

---

### 4. Historical Table Design

**Decision:** Separate `appointment_history` table with FK relationship.

**Rationale:**
- Audit trail always available
- Doesn't bloat main `appointments` table with old versions
- Standard database pattern (immutable history)

**Alternative:** Single table with "soft deletes"
- Harder to query current state
- Mixes old and new data

---

## Production Considerations

### Scaling Strategy

**Current:** Single-region, single-database instance
- Suitable for: 100-1000 RPM on appointment creation/update

**For 10x load:** Add read replicas
```
Write requests (POST)  → Primary PostgreSQL
Read requests (GET)    → Read Replicas
```

**For 100x load:** Consider sharding
```
Partition by: organization_id or date range
Database 1: Appointments for Org A
Database 2: Appointments for Org B
...
Router: Directs requests to correct shard
```

---

### Monitoring & Alerts

**What to monitor:**
- Transaction duration (locks should be quick)
- Lock wait times (pessimistic_write contention)
- 409 Conflict rate (indicates overlap issues)
- Database connection pool utilization
- API response latency (should be <100ms for creates)

**Suggested tools:**
- Prometheus + Grafana for metrics
- ELK Stack (Elasticsearch, Logstash, Kibana) for logs
- Sentry for error tracking

---

### Security Hardening

**Done:**
- Input validation (whitelist, forbid extra fields)
- SQL injection prevention (TypeORM parameterized queries)
- Proper HTTP status codes (no data leaks in errors)

**To add (before production):**
- Authentication (JWT or OAuth)
- Authorization (who can create appointments)
- Rate limiting (prevent brute-force or DoS)
- HTTPS/TLS (encrypted transport)
- Request logging (audit trail)
- CORS configuration (if frontend is separate domain)

---

### Database Optimization

**Indexes in place:**
- `(start, end)` composite index (overlap query optimization)
- `(appointmentId)` on history table (lookups by appointment)

**Potential additions:**
- `(start)` index (if query "appointments starting after date X")
- `(end)` index (if query "appointments ending before date X")

**Connection pooling:**
- Default: 10-20 connections
- Tune based on: (number of concurrent app instances) × 5-10

---

### Deployment Checklist

- [ ] Environment variables configured (DB credentials, PORT, etc.)
- [ ] Database migrations run successfully
- [ ] Swagger docs accessible at `/api`
- [ ] E2E tests passing with real database
- [ ] Rate limiting configured
- [ ] Logging configured (centralized log aggregation)
- [ ] Error monitoring (Sentry/DataDog) enabled
- [ ] CORS configured (if needed)
- [ ] SSL/TLS certificates installed
- [ ] Database backups configured
- [ ] Health check endpoint implemented (optional: `/health`)

---

## Troubleshooting

### Docker Compose fails with "connection refused"

**Issue:** Container can't connect to PostgreSQL

**Solution:**
```bash
# Ensure postgres container is up and healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Rebuild from scratch
docker-compose down --volumes
docker-compose up --build
```

---

### Tests fail with "database does not exist"

**Issue:** E2E tests can't find test database

**Solution:**
```bash
# Ensure PostgreSQL is running
# Create test database manually
psql -U postgres -c "CREATE DATABASE sesame_test;"

# Run E2E tests again
npm run test:e2e
```

---

### "Appointment time range is not available" on non-overlapping times

**Issue:** Overlap detection returning false positive

**Likely cause:** Timezone conversion issue

**Solution:**
- Ensure all date inputs use the same format: `YYYY-MM-DD HH:MM`
- Check that server timezone matches database timezone (PostgreSQL uses UTC by default)
- Review test output for actual stored vs. expected values

---

## Contributing

This is a demonstration project for a job assignment. The architecture is production-ready but may serve as a foundation for extensions:

**Potential enhancements:**
- [ ] Add GET endpoint for appointment history by ID
- [ ] Add DELETE/soft-delete for appointment cancellation
- [ ] Add search/filter (by date range, user, etc.)
- [ ] Add WebSocket support for real-time updates
- [ ] Add rate limiting per client
- [ ] Add authentication & multi-tenancy support

---

## License

This project is provided as-is for educational and assessment purposes.

---

## Contact

For questions about architecture or implementation, refer to the inline code comments and test files for detailed examples.
