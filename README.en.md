# Adequa AI - Resume Analysis MicroSaaS with AI

**AI system applied to professional profile evaluation**

Adequa AI is an intelligent platform that uses RAG (Retrieval-Augmented Generation) and advanced language models to automate resume analysis and screening, connecting qualified candidates to the right job openings.

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black)](https://adequa-ai-rag-resume-analyzer.vercel.app)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-19.2-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-latest-009688.svg)](https://fastapi.tiangolo.com/)

> **Language**: [Português (BR)](README.md) | **English**


## Key Features

### For Recruiters
- **Bulk upload**: send multiple resumes at once
- **Smart search**: find candidates by skills, experience, and location
- **Job management**: create and manage positions with detailed descriptions
- **Automatic analysis**: AI evaluates candidate-job compatibility in real-time
- **Reusable indexes**: saved vector stores for future queries

### For Candidates
- **Compatibility analysis**: see how well your profile fits job openings
- **Personalized dashboard**: view your applications and AI feedback
- **Recommendations**: receive suggestions for jobs matching your profile

### Technology
- **RAG with LlamaIndex**: semantic resume indexing
- **Groq API**: ultra-fast inference with Llama models
- **JWT Authentication**: secure login system for candidates and recruiters
- **Vector Stores**: embedding persistence for efficient queries

## Architecture

The project follows a **hexagonal architecture (ports and adapters)** with DDD (Domain-Driven Design) and also incorporates concepts from **Clean Architecture**.

```
📦 adequa-ai-rag-resume-analyzer
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/                 # Pages (Login, Dashboard, etc)
│   │   ├── components/            # Reusable components
│   │   ├── contexts/              # Context API (Auth)
│   │   └── lib/                   # APIs and utilities
│   └── dist/                      # Production build
│
├── application/                # Use cases and services
│   ├── use_cases/                 # Business logic
│   ├── services/                  # Application services
│   └── interfaces/                # Protocols/interfaces
│
├── domain/                     # Entities and business rules
│   ├── entities/                  # Candidates, Jobs, Resumes
│   ├── value_objects/             # CPF, Email, PhoneNumber
│   └── services/                  # Domain services
│
├── infrastructures/            # Concrete implementations
│   ├── ai/                        # LlamaIndex, Groq, embeddings
│   ├── db/                        # SQLAlchemy, UoW, migrations
│   ├── repositories/              # Data persistence
│   ├── storage/                   # S3, SQLite file storage
│   └── http/                      # Email, external APIs
│
├── presentation/               # Presentation layer
│   └── api/rest/v1/               # FastAPI endpoints
│
└── config/                     # Configuration and IoC
    ├── ioc/                       # Dependency Injection (Dishka)
    └── ai/                        # AI configuration
```
---

## Tech Stack

### Backend
- **FastAPI**: modern, async web framework
- **SQLAlchemy**: ORM with async support
- **Dishka**: dependency injection
- **LlamaIndex**: RAG and semantic indexing
- **Groq**: LLM inference (Llama 3.3)
- **Redis**: cache (optional)
- **Alembic**: database migrations

### Frontend
- **React 19**: UI library with modern hooks
- **TypeScript**: type safety
- **Vite**: ultra-fast build tool
- **TailwindCSS + DaisyUI**: neobrutalist styling
- **React Router**: client-side routing
- **Axios**: HTTP requests
- **Lucide React**: icons

### AI and ML
- **LlamaIndex**: RAG framework
- **Groq API**: optimized Llama models
- **Hugging Face**: embeddings and transformers
- **PyMuPDF**: PDF text extraction


## Main API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login

### Resumes
- `POST /api/v1/resumes/upload` - Upload resumes
- `GET /api/v1/resumes/indexes` - List saved indexes
- `DELETE /api/v1/resumes/indexes/{id}` - Delete index

### Jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs` - List jobs
- `GET /api/v1/jobs/{id}` - Job details

### Analysis
- `POST /api/v1/candidates/analyze` - Analyze candidates for job
- `POST /api/v1/candidates/search` - Search candidates by criteria

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Authors

Developed with ❤️ by Heloisa Cativo

---

