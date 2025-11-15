<!--
Sync Impact Report:
Version: 1.0.0 → 1.0.2
Modified Principles:
  - Principle V (Modularity & Separation of Concerns): Strengthened language and added standard file naming conventions
    * Emphasized self-contained requirement for feature modules
    * Added explicit prohibition on cross-module dependencies
    * Clarified module independence requirement
    * Added standard file naming patterns: [featurename].[type].ts
    * Defined 7 file types: routes, controller, service, repository, model, schemas, types
    * Added detailed enforcement rules (10 specific requirements)
Added Sections: None
Removed Sections: None
Templates Requiring Updates:
  ✅ constitution.md - Updated
  ⚠ plan-template.md - Constitution Check section should reference this document and file naming standards
  ⚠ spec-template.md - Should validate against Type Safety and Testing principles
  ⚠ tasks-template.md - Should reflect Testing, Observability task requirements, and standard file naming patterns
Follow-up TODOs: None
Rationale: PATCH version (1.0.2) - Added standard file naming conventions to clarify module organization without changing core principle
-->

# AI Image Dashboard API Constitution

## Core Principles

### I. Type Safety & Validation

**Rule**: All code MUST use strict TypeScript with no implicit `any` types. All external inputs (HTTP requests, environment variables, external APIs) MUST be validated with Zod schemas before processing.

**Rationale**: Type safety prevents entire classes of runtime errors. Validating all boundaries ensures data integrity throughout the system. This is non-negotiable because invalid data can corrupt databases, cause security vulnerabilities, and create unpredictable behavior.

**Enforcement**:
- TypeScript compiler configured with `strict: true`, `noImplicitAny: true`
- All environment variables validated via Zod schemas in `src/config/env.ts`
- All API request/response bodies validated with Zod schemas
- Type checking must pass: `npm run typecheck`

### II. Testing Discipline

**Rule**: All new features MUST include automated tests before being considered complete. Integration tests MUST verify API contracts. Unit tests MUST cover business logic. Test coverage MUST be maintained or increased with each change.

**Rationale**: Tests are executable documentation and regression prevention. Without tests, refactoring becomes dangerous and confidence in deployments decreases. Integration tests ensure API contracts remain stable for consumers.

**Enforcement**:
- Vitest for unit tests, Supertest for HTTP integration tests
- All features MUST include tests in their implementation phase
- Tests MUST pass before code review: `npm test`
- CI/CD pipeline MUST verify test passage before deployment

### III. Observability First

**Rule**: All runtime behavior MUST be observable through structured logging, metrics, and traces. Logs MUST be JSON-formatted with correlation IDs. All HTTP endpoints MUST expose Prometheus metrics. Request flows MUST support distributed tracing via OpenTelemetry.

**Rationale**: Production systems are opaque without observability. Structured logs enable parsing and analysis. Metrics enable performance monitoring. Traces enable debugging distributed requests. These tools are essential for operating production services.

**Enforcement**:
- Pino logger configured for structured JSON output in `src/lib/logger.ts`
- Request IDs automatically assigned to all HTTP requests
- Prometheus metrics exposed at `/metrics` endpoint
- OpenTelemetry SDK integrated for distributed tracing
- All significant operations MUST emit structured logs

### IV. Security by Default

**Rule**: Security MUST be built-in, not bolted-on. All HTTP responses MUST include security headers (CSP, HSTS, etc.). All external inputs MUST be validated. Rate limiting MUST protect against abuse. Secrets MUST never be committed to version control.

**Rationale**: Security vulnerabilities can destroy user trust and expose liability. Defense-in-depth requires multiple layers. Proactive security measures are cheaper than reactive incident response.

**Enforcement**:
- Helmet middleware applies 15+ security headers automatically
- CORS configured with explicit allowed origins
- Rate limiting prevents DoS attacks via express-rate-limit
- Environment validation fails fast if secrets are missing
- `.gitignore` excludes `.env` files
- All authentication/authorization goes through dedicated middleware

### V. Modularity & Separation of Concerns

**Rule**: All feature code MUST be organized into self-contained modules under `src/modules/[feature]/`. Each module MUST contain all code related to that feature: routes, controllers, schemas, and tests. Feature modules MUST NOT directly depend on other feature modules. Cross-cutting concerns (logging, database, cache) MUST live in `src/lib/`. Middleware MUST be single-purpose and composable.

**Rationale**: Self-contained modules enable independent development, testing, and reasoning about features. When a module contains everything for a feature, developers can understand and modify it without hunting through the entire codebase. Preventing cross-module dependencies eliminates tangled coupling that makes refactoring dangerous. This architecture supports parallel team development and enables features to be added, modified, or removed with minimal impact on other features.

**Enforcement**:
- **Feature modules are mandatory**: ALL features MUST live in `src/modules/[feature]/`
- **Module structure**: Each module MUST contain its own routes, controllers, schemas, and tests
- **Standard file naming**: Module files MUST follow the pattern `[featurename].[type].ts`:
  - `[featurename].routes.ts` - Route definitions and endpoint registration
  - `[featurename].controller.ts` - Request/response handling and orchestration
  - `[featurename].service.ts` - Business logic and domain operations
  - `[featurename].repository.ts` - Database access layer (Prisma operations)
  - `[featurename].model.ts` - Domain models and business entities (if needed)
  - `[featurename].schemas.ts` - Zod validation schemas for API contracts
  - `[featurename].types.ts` - TypeScript types and interfaces
- **Self-contained requirement**: Feature modules MUST NOT import from other feature modules
- **Shared code location**: Cross-cutting infrastructure MUST be in `src/lib/` (logger, db, redis, metrics, etc.)
- **Middleware location**: All middleware MUST be in `src/middleware/` (one concern per file)
- **No circular dependencies**: Module dependency graph MUST be acyclic
- **Module independence**: Removing a module MUST NOT break other modules (only shared infrastructure dependencies allowed)

## Development Standards

### Environment Configuration

- Environment variables MUST be validated at startup with Zod schemas
- Application MUST fail fast with clear error messages if configuration is invalid
- `.env.example` MUST document all required variables with example values
- Sensitive values MUST NOT be committed (enforced by `.gitignore`)

### Code Quality

- ESLint and Prettier MUST be configured and enforced
- Code MUST pass linting before commit: `npm run lint`
- Code MUST be formatted consistently: `npm run format`
- No console.log statements in production code (use structured logger)
- Comments explain "why", not "what" (code should be self-documenting)

### Version Control

- Commits MUST be atomic and include descriptive messages
- Commit messages SHOULD follow conventional commits format
- Feature work MUST occur in feature branches
- Branch naming: `[###]-[feature-name]` (e.g., `001-project-init`)

## Architecture & Design

### API Design

- RESTful conventions MUST be followed for HTTP endpoints
- Health check endpoints MUST be provided: `/health`, `/health/ready`, `/health/live`
- API documentation MUST be generated from code (Zod schemas → OpenAPI)
- Request/response validation MUST be automatic via middleware
- Error responses MUST be consistent and include helpful messages

### Database Management

- Prisma ORM MUST be used for all database access
- Database schema MUST be managed through Prisma migrations
- Migrations MUST be versioned and applied in order
- Database connections MUST use connection pooling
- Failed database operations MUST be logged with context

### Performance & Scalability

- Response time p95 target: <200ms for API endpoints
- Hot reload target: <2s for development server restart
- Docker image size target: <200MB
- Application startup target: <5s
- Graceful shutdown MUST drain connections (30s timeout)

### Error Handling

- All errors MUST be caught and handled gracefully
- Unhandled errors MUST be logged with full context
- User-facing errors MUST be sanitized (no stack traces in production)
- Operational errors (validation, auth) MUST return appropriate HTTP codes
- Database/cache failures MUST degrade gracefully with fallback behavior

## Governance

### Constitution Authority

This constitution supersedes all other practices and conventions. All code changes, architectural decisions, and process modifications MUST comply with these principles.

### Amendment Process

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Team discussion and consensus building
3. **Version Bump**: Follow semantic versioning (MAJOR.MINOR.PATCH)
   - MAJOR: Backward-incompatible principle removals or redefinitions
   - MINOR: New principles added or materially expanded guidance
   - PATCH: Clarifications, wording improvements, typo fixes
4. **Update**: Modify constitution and propagate changes to dependent templates
5. **Ratification**: Update version and last amended date

### Compliance Verification

- All pull requests MUST verify compliance with constitution principles
- Code reviews MUST check for violations
- Complexity MUST be justified against simplicity principles
- Deviations MUST be documented with clear rationale
- Constitution violations are grounds for rejecting changes

### Runtime Guidance

For day-to-day development guidance and active technology tracking, refer to `CLAUDE.md` in the repository root. That file is auto-generated from feature plans and provides current tech stack, commands, and recent changes.

**Version**: 1.0.2 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
