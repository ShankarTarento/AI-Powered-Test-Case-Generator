# Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Docker & Docker Compose**: [Download](https://www.docker.com/get-started)
- **PostgreSQL 15+**: (Or use Docker)
- **Redis 7+**: (Or use Docker)
- **Git**: [Download](https://git-scm.com/downloads)

## Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd AI-Powered-Test-Case-Generator

# Start all services
docker-compose up -d

# Backend will be available at: http://localhost:8000
# Frontend will be available at: http://localhost:3000
# API docs: http://localhost:8000/docs
```

## Manual Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 3. Database Setup (If not using Docker)

```bash
# Create PostgreSQL database
createdb testgen_db

# Run migrations
cd backend
alembic upgrade head
```

### 4. Redis Setup (If not using Docker)

```bash
# Install Redis
# macOS:
brew install redis
brew services start redis

# Linux:
sudo apt-get install redis-server
sudo systemctl start redis

# Windows:
# Download from: https://redis.io/download
```

## Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://testgen:testgen_dev_password@localhost:5432/testgen_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Jira (Get from https://developer.atlassian.com/)
JIRA_OAUTH_CLIENT_ID=your-jira-client-id
JIRA_OAUTH_CLIENT_SECRET=your-jira-client-secret

# Optional: System LLM Keys (for fallback)
SYSTEM_OPENAI_API_KEY=sk-...
SYSTEM_ANTHROPIC_API_KEY=sk-ant-...
SYSTEM_GOOGLE_API_KEY=...

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=AI Test Case Generator
```

## Running Tests

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Development Workflow

### 1. Create a new feature branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make changes and commit

```bash
git add .
git commit -m "feat: your feature description"
```

### 3. Run tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

### 4. Push and create PR

```bash
git push origin feature/your-feature-name
```

## Database Migrations

### Create a new migration

```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migrations

```bash
alembic downgrade -1  # Rollback one migration
alembic downgrade base  # Rollback all migrations
```

## Common Issues

### Issue: Port already in use

```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Issue: Database connection error

```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL
# macOS:
brew services restart postgresql

# Linux:
sudo systemctl restart postgresql
```

### Issue: Redis connection error

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

## Additional Tools

### API Testing

```bash
# Using httpie
http GET http://localhost:8000/health

# Using curl
curl http://localhost:8000/health
```

### Database GUI

- **DBeaver**: [Download](https://dbeaver.io/)
- **pgAdmin**: [Download](https://www.pgadmin.org/)

### Redis GUI

- **RedisInsight**: [Download](https://redis.com/redis-enterprise/redis-insight/)

## Next Steps

1. ✅ Read [Architecture Documentation](../architecture/README.md)
2. ✅ Review [API Documentation](../api/README.md)
3. ✅ Check [Contributing Guidelines](../../CONTRIBUTING.md)
4. ✅ Join development Slack channel

## Support

- Documentation: [/docs](../README.md)
- Issues: [GitHub Issues](https://github.com/your-org/testgen/issues)
- Email: dev@example.com
