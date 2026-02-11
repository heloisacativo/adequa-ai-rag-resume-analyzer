# Contribution Guide

Thank you for considering contributing to Adequa AI! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/adequa-ai-rag-resume-analyzer.git
cd adequa-ai-rag-resume-analyzer

# Add the original repository as upstream
git remote add upstream https://github.com/original-user/adequa-ai-rag-resume-analyzer.git
```

### 2. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new branch for your feature/bugfix
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-fix
```

### 3. Make Your Changes

- Write clean and well-documented code
- Follow the project's code standards
- Update documentation if necessary

### 4. Commit

Use clear and descriptive commit messages:

```bash
# Commit message format
git commit -m "type: short description

More detailed description if necessary"
```

**Commit Types:**
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation changes
- `style`: formatting, no code changes
- `refactor`: code refactoring
- `test`: adding or fixing tests
- `chore`: maintenance tasks

**Examples:**
```bash
git commit -m "feat: add location filter to candidate search"
git commit -m "fix: resolve error when uploading multiple PDFs"
git commit -m "docs: update README with deployment instructions"
```

### 5. Push and Pull Request

```bash
# Push to your fork
git push origin feature/my-feature

# Open a Pull Request on GitHub
```

## Areas to Contribute

### Backend (Python/FastAPI)
- RAG system improvements
- Performance optimizations
- New API endpoints
- Automated tests
- Integration with new LLMs

### Frontend (React/TypeScript)
- Reusable components
- UX/UI improvements
- Accessibility
- Responsiveness
- Component tests

### AI and ML
- New embedding models
- Prompt optimization
- More accurate analyses
- Support for additional file formats

### Documentation
- Tutorials
- Usage examples
- Translations
- README improvements

### Infrastructure
- Docker/containerization
- CI/CD
- Monitoring
- Security

## Code Standards

### Python
- Follow [PEP 8](https://pep8.org/)
- Use type hints when possible
- Docstrings for public classes and functions
- Maximum of 100 characters per line

### TypeScript/React
- Use strict TypeScript
- Functional components with hooks
- Typed props with interfaces
- Naming: PascalCase for components, camelCase for functions

### CSS/TailwindCSS
- Use Tailwind classes whenever possible
- Maintain the project's neobrutalist style
- Mobile-first responsiveness

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project standards
- [ ] All tests pass
- [ ] New tests are added (if applicable)
- [ ] Documentation is updated
- [ ] Commit is well-described
- [ ] No conflicts with the main branch
- [ ] Code is tested locally

## Reporting Bugs

When reporting a bug, include:

- **Clear description** of the issue
- **Steps to reproduce**
- **Expected behavior** vs **actual behavior**
- **Screenshots** (if applicable)
- **Environment**: OS, Python/Node versions, browser
- **Error logs** (if any)

## Suggesting Features

When suggesting a new feature:

- **Clear description** of the feature
- **Use case**: why is it useful?
- **Considered alternatives**
- **Mockups** or wireframes (if applicable)

## Contact

Questions? Open an issue or get in touch:

- **Issues**: [GitHub Issues](https://github.com/your-username/adequa-ai-rag-resume-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/adequa-ai-rag-resume-analyzer/discussions)

---

Thank you for contributing to Adequa AI!