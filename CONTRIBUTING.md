# Contributing to Gorombo Appointments Plugin

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something useful together.

## Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gorombo-appointments-plugin.git
   cd gorombo-appointments-plugin
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up the dev environment**:
   ```bash
   cp dev/.env.example dev/.env
   # Edit dev/.env with your database connection
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new booking confirmation email
fix: resolve calendar timezone issue
docs: update API documentation
refactor: simplify slot calculation logic
test: add tests for guest customer creation
```

### Code Style

- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- Follow existing code patterns in the codebase
- Add TypeScript types for all new code
- Write descriptive variable and function names

### Testing

- Add tests for new features
- Ensure existing tests pass: `npm test`
- Test manually in the dev environment

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, focused commits

3. **Run checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

6. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Testing instructions

## Reporting Issues

When reporting bugs, please include:

- Plugin version
- PayloadCMS version
- Database adapter (MongoDB/PostgreSQL/SQLite)
- Steps to reproduce
- Expected vs actual behavior
- Error logs if applicable

## Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Describe the use case clearly
- Explain why it would benefit other users

## Questions?

Open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
