# Operator App Deployment Guide

## Overview
This guide covers deploying the Operator App to production environments including AWS, DigitalOcean, and other cloud providers.

## Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (for production)
- Cloud provider account (AWS, DigitalOcean, etc.)

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd operator-app
```

### 2. Install Dependencies
```bash
npm run setup
```

### 3. Environment Configuration
Copy environment files and configure:
```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env
```

Update the following variables in `backend/.env`:
```env
DATABASE_URL="postgresql://operator:operator123@postgres:5432/operator_app"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"
```

### 4. Start Development Environment
```bash
# Using Docker (Recommended)
npm run docker:up

# Or run locally
npm run dev:backend  # Terminal 1
npm run dev:web      # Terminal 2
npm run dev:mobile   # Terminal 3
```

### 5. Access Applications
- Web Dashboard: http://localhost:3000
- Backend API: http://localhost:3001
- Mobile App: Expo development server

## Production Deployment

### Docker Production Setup

#### 1. Create Production Docker Compose
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: operator_app
      POSTGRES_USER: operator
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U operator -d operator_app"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://operator:${DB_PASSWORD}@postgres:5432/operator_app
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: ${API_URL}
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2. Create Nginx Configuration
Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream web {
        server web:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Web app
        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }
    }
}
```

#### 3. Create Production Environment File
Create `.env.prod`:

```env
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-super-secure-jwt-secret
API_URL=https://your-domain.com/api
```

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER

# Clone repository
git clone <repository-url>
cd operator-app
```

#### 2. Configure Security Groups
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Web App - optional)
- Port 3001 (API - optional)

#### 3. Deploy Application
```bash
# Copy production environment
cp .env.prod .env

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem
```

### DigitalOcean Deployment

#### 1. Create Droplet
- Choose Ubuntu 20.04 LTS
- Select appropriate size (2GB RAM minimum)
- Add SSH key

#### 2. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Deploy Application
Follow the same steps as AWS deployment.

### Database Backup

#### 1. Automated Backup Script
Create `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="operator_app_backup_$DATE.sql"

# Create backup
docker exec postgres pg_dump -U operator operator_app > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### 2. Schedule Backup
```bash
# Add to crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Monitoring and Logging

#### 1. Application Logs
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f web
```

#### 2. Database Monitoring
```bash
# Connect to database
docker exec -it postgres psql -U operator -d operator_app

# Check database size
SELECT pg_size_pretty(pg_database_size('operator_app'));

# Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_readings_station_date ON daily_readings(station_id, reading_date);
CREATE INDEX CONCURRENTLY idx_faults_status_priority ON faults(status, priority);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

#### 2. Application Optimization
- Enable gzip compression in Nginx
- Use CDN for static assets
- Implement Redis for session storage
- Add database connection pooling

### Security Considerations

#### 1. Environment Variables
- Never commit `.env` files
- Use strong passwords and secrets
- Rotate JWT secrets regularly

#### 2. Database Security
- Use strong database passwords
- Enable SSL connections
- Regular security updates

#### 3. Application Security
- Keep dependencies updated
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

### Troubleshooting

#### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if database is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **Application Won't Start**
   ```bash
   # Check application logs
   docker-compose logs backend
   
   # Check environment variables
   docker-compose config
   ```

3. **File Upload Issues**
   ```bash
   # Check upload directory permissions
   ls -la uploads/
   
   # Check Nginx configuration
   docker-compose logs nginx
   ```

### Maintenance

#### Regular Tasks
- Monitor disk space
- Check application logs
- Update dependencies
- Backup database
- Security updates

#### Scaling
- Use load balancers for multiple instances
- Implement database replication
- Use container orchestration (Kubernetes)
- Add caching layers
