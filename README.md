# AI-Powered Test Case Generator

**AI-agnostic SaaS platform for automated test case generation from Jira user stories**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)

## 🎯 Overview

Reduce QA manual effort by 60-70% with AI-powered test case generation. Integrates seamlessly with Jira, supports multiple LLM providers (OpenAI, Anthropic, Google, Azure), and allows users to bring their own API keys.

### Key Features

- ✨ **AI-Agnostic**: Support for OpenAI, Anthropic, Google Gemini, Azure OpenAI, and open-source models
- 🔐 **BYOK (Bring Your Own Key)**: Users provide their own API keys for zero AI costs
- 🔄 **Jira Integration**: Real-time sync via REST API + Webhooks
- 📊 **Sprint Dashboard**: Coverage tracking, gap analysis, and analytics
- 🎨 **Multiple Test Formats**: Gherkin (Given/When/Then), step-by-step, tabular
- 📈 **Analytics**: Time saved, AI accuracy, cost tracking per user
- 🔒 **Enterprise-Ready**: OAuth 2.0, RBAC, encryption, audit logs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User (QA Engineer)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼────────┐         ┌─────────▼─────────┐
│   React UI     │         │   Jira Cloud      │
│  (TypeScript)  │         │   REST API        │
└───────┬────────┘         └─────────┬─────────┘
        │                            │
        │         ┌──────────────────┘
        │         │
┌───────▼─────────▼──────────────────────────────────┐
│              FastAPI Backend                       │
│  ┌──────────────┐  ┌──────────────┐              │
│  │   Auth API   │  │   Jira Sync  │              │
│  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  AI Gateway  │  │  Test Cases  │              │
│  │  (LiteLLM)   │  │     CRUD     │              │
│  └──────┬───────┘  └──────────────┘              │
└─────────┼──────────────────────────────────────────┘
          │
    ┌─────┴─────────────────────────────┐
    │                                   │
┌───▼──────────┐  ┌──────────┐  ┌──────▼──────┐
│  PostgreSQL  │  │  Redis   │  │   Qdrant    │
│  (RDS)       │  │  (Cache) │  │  (Vectors)  │
└──────────────┘  └──────────┘  └─────────────┘
          │
    ┌─────┴─────────────────┐
    │                       │
┌───▼──────────┐  ┌─────────▼────────┐
│ User's LLM   │  │  Celery Workers  │
│  Provider    │  │  (Background)    │
│ (OpenAI/etc) │  └──────────────────┘
└──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd AI-Powered-Test-Case-Generator

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
alembic upgrade head

# Setup frontend
cd ../frontend
npm install

# Start all services with Docker Compose
cd ..
docker-compose up -d

# Backend runs on: http://localhost:8000
# Frontend runs on: http://localhost:3000
# API docs: http://localhost:8000/docs
```

## 📁 Project Structure

```
AI-Powered-Test-Case-Generator/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── jira.py
│   │   │   │   ├── test_cases.py
│   │   │   │   ├── ai.py
│   │   │   │   └── analytics.py
│   │   ├── core/              # Config, security
│   │   ├── db/                # Database models
│   │   ├── services/          # Business logic
│   │   │   ├── jira_service.py
│   │   │   ├── ai_service.py
│   │   │   └── llm_orchestrator.py  # LiteLLM wrapper
│   │   └── main.py
│   ├── alembic/               # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/          # API clients
│   │   ├── store/             # Zustand state
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── infrastructure/             # IaC & deployment
│   ├── terraform/
│   ├── k8s/
│   └── docker-compose.yml
├── docs/                       # Documentation
│   ├── api/
│   ├── architecture/
│   └── setup/
├── plan/                       # Project planning
│   ├── brd.txt
│   ├── development_plan.txt
│   └── techstack.txt
├── .github/
│   └── workflows/             # CI/CD
│       ├── backend-ci.yml
│       └── frontend-ci.yml
├── .gitignore
├── README.md
└── LICENSE
```

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript 5 + Vite
- **Zustand** for state management
- **React Query** for server state
- **Tailwind CSS** + shadcn/ui components
- **Recharts** for analytics visualization

### Backend
- **Python 3.11** + **FastAPI 0.110+**
- **SQLAlchemy 2.0** (async) + Alembic
- **Celery** for background jobs
- **LiteLLM** for multi-provider AI orchestration
- **pytest** for testing

### Databases
- **PostgreSQL 15+** - Primary database
- **Qdrant** - Vector database for RAG
- **Redis 7** - Cache + job queue

### AI/ML
- **LiteLLM** - Unified API for 100+ LLMs
- Supports: OpenAI, Anthropic, Google, Azure, Open-source
- **LangChain** - RAG pipelines (optional)

### Infrastructure
- **Docker** + **Kubernetes** (AWS EKS)
- **AWS RDS** (PostgreSQL), **ElastiCache** (Redis)
- **GitHub Actions** for CI/CD

## 🔧 Configuration

### Environment Variables

Create `.env` files in backend and frontend directories:

**backend/.env**
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/testgen
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Jira
JIRA_OAUTH_CLIENT_ID=your-jira-client-id
JIRA_OAUTH_CLIENT_SECRET=your-jira-secret

# System LLM (optional fallback)
SYSTEM_OPENAI_API_KEY=sk-...
SYSTEM_ANTHROPIC_API_KEY=sk-ant-...

# Vector DB
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

**frontend/.env**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=AI Test Case Generator
VITE_ENABLE_ANALYTICS=false
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:e2e  # Playwright E2E tests
```

## 📦 Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
# Build images
docker build -t testgen-backend:latest ./backend
docker build -t testgen-frontend:latest ./frontend

# Deploy to K8s
kubectl apply -f infrastructure/k8s/
```

### AWS EKS (Recommended)
See [docs/deployment/aws-eks.md](docs/deployment/aws-eks.md)

## 📊 Supported LLM Providers

Users can configure their own API keys for:

| Provider | Models | Cost (per 1M tokens) |
|----------|--------|---------------------|
| **OpenAI** | GPT-4 Turbo, GPT-4o, GPT-3.5 | $10-$30 |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | $15-$75 |
| **Google** | Gemini 2.0 Flash, Gemini Pro | $0.10-$7 |
| **Azure OpenAI** | GPT-4, GPT-3.5 | $10-$30 |
| **Open-Source** | Llama 3, Mixtral (via APIs) | $0.20-$2 |

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- FastAPI framework by Sebastián Ramírez
- React team at Meta
- LiteLLM by BerriAI
- All LLM providers (OpenAI, Anthropic, Google)

## 📞 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-org/testgen/issues)
- Email: support@example.com

---

**Built with ❤️ for QA Engineers**
