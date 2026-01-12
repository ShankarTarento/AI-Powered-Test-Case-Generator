# Docker Setup Guide

This project includes a complete Docker setup to run both frontend and backend services along with all dependencies.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB of available RAM
- Ports 3000, 8000, 5433, 6334, 6335, 6380 available

## Services Included

1. **Frontend** - React + Vite (Port 3000)
2. **Backend** - FastAPI (Port 8000)
3. **PostgreSQL** - Database (Port 5433)
4. **Redis** - Cache (Port 6380)
5. **Qdrant** - Vector Database (Ports 6334, 6335)

## Quick Start

### 1. Start all services

```bash
docker-compose up
```

This will:
- Build the frontend and backend images
- Start all services (PostgreSQL, Redis, Qdrant, Backend, Frontend)
- Initialize the database
- Make the application available at:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:8000
  - API Docs: http://localhost:8000/docs

### 2. Start in detached mode (background)

```bash
docker-compose up -d
```

### 3. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Stop all services

```bash
docker-compose down
```

### 5. Stop and remove volumes (clean slate)

```bash
docker-compose down -v
```

## Development Workflow

### Hot Reloading

Both frontend and backend support hot reloading:
- Backend: Changes to Python files will trigger automatic reload
- Frontend: Changes to React files will trigger automatic refresh

### Rebuilding after dependency changes

If you modify `requirements.txt` or `package.json`:

```bash
docker-compose down
docker-compose build
docker-compose up
```

Or rebuild specific service:

```bash
docker-compose build backend
docker-compose build frontend
```

### Execute commands inside containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run database migrations
docker-compose exec backend python init_db.py

# Install new Python package
docker-compose exec backend pip install package-name
docker-compose exec backend pip freeze > requirements.txt

# Install new npm package
docker-compose exec frontend npm install package-name
```

### Database access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U testgen_user -d testgen_db

# Or from host machine (if you have psql installed)
psql -h localhost -p 5433 -U testgen_user -d testgen_db
```

### Redis CLI

```bash
docker-compose exec redis redis-cli
```

## Environment Variables

You can customize environment variables in `docker-compose.yml` or create a `.env` file in the project root:

```env
# Database
POSTGRES_USER=testgen_user
POSTGRES_PASSWORD=testgen_password
POSTGRES_DB=testgen_db

# Backend
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Frontend
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Port conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port to 3001
```

### Database connection issues

1. Check if PostgreSQL is healthy:
```bash
docker-compose ps
```

2. Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

3. Restart the database:
```bash
docker-compose restart postgres
```

### Frontend not connecting to backend

1. Ensure `VITE_API_URL` in docker-compose.yml matches your setup
2. Check CORS settings in backend configuration
3. Verify backend is running: `docker-compose logs backend`

### Clean everything and start fresh

```bash
# Stop all containers
docker-compose down -v

# Remove images
docker-compose down --rmi all -v

# Rebuild and start
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production, create a separate `docker-compose.prod.yml`:

1. Use production builds for frontend
2. Remove volume mounts
3. Use environment variables from secrets
4. Add nginx reverse proxy
5. Enable SSL/TLS
6. Configure proper logging

Example production frontend Dockerfile:

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Useful Commands

```bash
# View service status
docker-compose ps

# View resource usage
docker stats

# Remove stopped containers
docker-compose rm

# Pull latest images
docker-compose pull

# Show service configuration
docker-compose config

# Scale services (if needed)
docker-compose up -d --scale backend=3
```
