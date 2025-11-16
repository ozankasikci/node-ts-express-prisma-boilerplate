# node-ts-express-prisma-boilerplate Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-15

## Active Technologies
- TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Vitest 4.0 (test runner), Supertest 7.1 (HTTP testing), pg-mem 3.0 (in-memory PostgreSQL), @vitest/coverage-v8 4.0 (coverage reporting) (002-extensive-tests)
- In-memory PostgreSQL (pg-mem) for integration tests, no external database dependencies required (002-extensive-tests)
- TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Express 5.1, Prisma 6.19, Zod 3.23, Pino 10.1 (logging), Node.js crypto module (encryption) (003-remote-config)
- PostgreSQL (via Prisma ORM) with two new tables: SystemConfig and ConfigHistory (003-remote-config)

- TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Express 5.1, Prisma 6.19, Redis (ioredis 5.8), BullMQ 5.63, bcrypt 6.0, jsonwebtoken 9.0, Pino 10.1, Helmet 8.1, Zod 3.23 (001-node-ts-template)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0: Follow standard conventions

## Recent Changes
- 003-remote-config: Added TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Express 5.1, Prisma 6.19, Zod 3.23, Pino 10.1 (logging), Node.js crypto module (encryption)
- 002-extensive-tests: Added TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Vitest 4.0 (test runner), Supertest 7.1 (HTTP testing), pg-mem 3.0 (in-memory PostgreSQL), @vitest/coverage-v8 4.0 (coverage reporting)

- 001-node-ts-template: Added TypeScript 5.9+ with ES2022 module support, Node.js ≥22.0.0, npm ≥10.0.0 + Express 5.1, Prisma 6.19, Redis (ioredis 5.8), BullMQ 5.63, bcrypt 6.0, jsonwebtoken 9.0, Pino 10.1, Helmet 8.1, Zod 3.23

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
