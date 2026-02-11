---
title: Adequa AI - Resume Analysis
emoji: 📄
colorFrom: blue
colorTo: green
sdk: streamlit
sdk_version: "1.15.2"
python_version: "3.11"
app_file: main.py
pinned: false
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# Adequa AI - MicroSaaS de Análise de Currículos com IA

**Sistema de IA aplicado à avaliação de perfis profissionais**

Adequa AI é uma plataforma inteligente que utiliza RAG (Retrieval-Augmented Generation) e modelos de linguagem avançados para automatizar a análise e triagem de currículos, conectando candidatos qualificados às vagas certas.

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black)](https://adequa-ai-rag-resume-analyzer.vercel.app)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-19.2-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-latest-009688.svg)](https://fastapi.tiangolo.com/)

> 🌐 **Idioma**: **Português (BR)** | [English](README.en.md)

---

## Principais Funcionalidades

### Para Recrutadores
- **Upload em massa**: envie múltiplos currículos de uma vez
- **Busca inteligente**: encontre candidatos por habilidades, experiência e localização
- **Gestão de vagas**: crie e gerencie vagas com descrições detalhadas
- **Análise automática**: IA avalia compatibilidade candidato-vaga em tempo real
- **Índices reutilizáveis**: vector stores salvos para consultas futuras

### Para Candidatos
- **Análise de compatibilidade**: veja o quanto seu perfil se adequa às vagas
- **Dashboard personalizado**: visualize suas candidaturas e feedback da IA
- **Recomendações**: receba sugestões de vagas compatíveis com seu perfil

### Tecnologia
- **RAG com LlamaIndex**: indexação semântica de currículos
- **Groq API**: inferência ultra-rápida com modelos Llama
- **Vector Stores**: persistência de embeddings para consultas eficientes

---

## Arquitetura

O projeto segue uma **arquitetura hexagonal (ports and adapters)** com DDD (Domain-Driven Design) e também utiliza conceitos de **Clean Architecture**.

```
adequa-ai-rag-resume-analyzer
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/                 # Páginas (Login, Dashboard, etc)
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── contexts/              # Context API (Auth)
│   │   └── lib/                   # APIs e utilitários
│   └── dist/                      # Build de produção
│
├── application/                # Casos de uso e serviços
│   ├── use_cases/                 # Lógica de negócio
│   ├── services/                  # Serviços de aplicação
│   └── interfaces/                # Protocolos/interfaces
│
├── domain/                     # Entidades e regras de negócio
│   ├── entities/                  # Candidatos, Jobs, Resumes
│   ├── value_objects/             # CPF, Email, PhoneNumber
│   └── services/                  # Serviços de domínio
│
├── infrastructures/            # Implementações concretas
│   ├── ai/                        # LlamaIndex, Groq, embeddings
│   ├── db/                        # SQLAlchemy, UoW, migrations
│   ├── repositories/              # Persistência de dados
│   ├── storage/                   # S3, SQLite file storage
│   └── http/                      # Email, APIs externas
│
├── presentation/               # Camada de apresentação
│   └── api/rest/v1/               # Endpoints FastAPI
│
└── config/                     # Configurações e IoC
    ├── ioc/                       # Dependency Injection (Dishka)
    └── ai/                        # Configuração de IA
```


## Stack 

### Backend
- **FastAPI**: framework web moderno e assíncrono
- **SQLAlchemy**: ORM com suporte assíncrono
- **Dishka**: injeção de dependências
- **LlamaIndex**: RAG e indexação semântica
- **Groq**: inferência de LLMs (Llama 3.3)
- **Redis**: cache (opcional)
- **Alembic**: migrations de banco de dados

### Frontend
- **React 19**: biblioteca UI com hooks modernos
- **TypeScript**: type safety
- **Vite**: build tool ultra-rápido
- **TailwindCSS + DaisyUI**: estilização neobrutalist
- **React Router**: roteamento client-side
- **Axios**: requisições HTTP
- **Lucide React**: ícones

### IA e ML
- **LlamaIndex**: framework RAG
- **Groq API**: modelos Llama otimizados
- **Hugging Face**: embeddings e transformers
- **PyMuPDF**: extração de texto de PDFs

---

## Autores

Desenvolvido com ❤️ por Heloisa Cativo
