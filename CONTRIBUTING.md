# Contributing Guide

Thank you for considering contributing to this template project!

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone <your-fork-url>
   cd node-ts-express-prisma-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local services**
   ```bash
   cd docker && docker-compose up -d
   # Or from root: docker-compose -f docker/docker-compose.yml up -d
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate:dev
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript

- Use strict TypeScript mode
- Prefer interfaces over types for object shapes
- Use type inference where possible
- Avoid `any` type (enforced by ESLint)

### Code Style

- Run `npm run format` before committing
- Run `npm run lint` to check for issues
- Follow existing patterns in the codebase

### Module Structure

All feature modules should follow this structure:

```
src/modules/[feature]/
├── [feature].types.ts      # TypeScript interfaces
├── [feature].schemas.ts    # Zod validation schemas
├── [feature].repository.ts # Database operations
├── [feature].service.ts    # Business logic
├── [feature].controller.ts # HTTP handlers
└── [feature].routes.ts     # Route definitions
```

### Naming Conventions

- **Files**: kebab-case (e.g., `auth.service.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `UserProfile`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)

## Testing

### Writing Tests

- Write tests for all new features
- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Use descriptive test names
- Test both success and failure cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Guidelines

- Fill out the PR template completely
- Link related issues
- Ensure all tests pass
- Update documentation if needed
- Request review from maintainers

## Code Review Process

- All PRs require at least one approval
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Squash commits before merging if needed

## Questions?

Open an issue for questions or discussions!
