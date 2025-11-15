# Node.js TypeScript Express Prisma Boilerplate

A production-ready Node.js boilerplate with TypeScript, Express 5, Prisma ORM, Redis, BullMQ, and comprehensive middleware stack.

## Features

- **TypeScript 5.9+** with strict mode and ES2022 modules
- **Express 5.1** with async/await support
- **Prisma 6.19** for type-safe database access
- **Redis & BullMQ** for caching and background job processing
- **JWT Authentication** with bcrypt password hashing
- **Security** - Helmet, CORS, rate limiting
- **Observability** - Pino structured logging, OpenTelemetry, Prometheus metrics
- **Testing** - Vitest with Supertest and pg-mem
- **Code Quality** - ESLint, Prettier, strict TypeScript

## Quick Start

See [Quickstart Guide](./specs/001-node-ts-template/quickstart.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Set up database
npm run db:migrate:dev

# Start development server
npm run dev
```

## Project Structure

```
src/
├── config/          # Environment configuration
├── lib/             # Shared utilities (logger, db, redis, queue)
├── middleware/      # Express middleware (auth, logging, errors)
├── modules/         # Feature modules (health, auth, user, tasks)
├── types/           # TypeScript type definitions
├── workers/         # Background job workers
├── app.ts           # Express app setup
└── server.ts        # Server entry point

tests/
├── integration/     # HTTP endpoint tests
├── unit/            # Business logic tests
└── setup.ts         # Test configuration

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Migration history
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Documentation

- [Quickstart Guide](./specs/001-node-ts-template/quickstart.md)
- [Data Model](./specs/001-node-ts-template/data-model.md)
- [API Contracts](./specs/001-node-ts-template/contracts/openapi.yaml)
- [Implementation Plan](./specs/001-node-ts-template/plan.md)

## Tech Stack

- **Runtime**: Node.js ≥22.0.0
- **Language**: TypeScript 5.9+
- **Web Framework**: Express 5.1
- **Database**: PostgreSQL with Prisma 6.19
- **Cache/Queue**: Redis with ioredis 5.8 and BullMQ 5.63
- **Auth**: JWT (jsonwebtoken 9.0) + bcrypt 6.0
- **Logging**: Pino 10.1
- **Metrics**: Prometheus (prom-client)
- **Tracing**: OpenTelemetry
- **Testing**: Vitest 4.0, Supertest 7.1, pg-mem 3.0
- **Validation**: Zod 4.1
- **Build**: tsup 8.5
- **Dev Server**: tsx 4.20 + nodemon 3.1

## License

MIT
