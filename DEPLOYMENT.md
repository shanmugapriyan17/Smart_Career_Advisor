# Smart Career Advisor - Deployment Guide

[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Flask 2.3](https://img.shields.io/badge/Flask-2.3-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/yourusername/SCA)

This guide covers deploying Smart Career Advisor to production using various cloud platforms.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Build & Testing](#production-build--testing)
3. [Deployment Options](#deployment-options)
4. [CI/CD Pipelines](#cicd-pipelines)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Local Development Setup

### Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/yourusername/SCA.git
cd SCA

# Or download ZIP and extract
unzip SCA-main.zip
cd SCA
```

### Virtual Environment (All Platforms)

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### Install Dependencies

```bash
# Install required packages
pip install -r requirements.txt

# Download NLTK data for NLP
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Train Models (One-time Setup)

```bash
# Generate and train ML models
python train_model.py

# Output: models/best_model.joblib, vectorizer.joblib, label_encoder.joblib
```

### Run Locally

```bash
# Development mode (with auto-reload and debug)
python app.py

# Open browser: http://localhost:5000
```

---

## Production Build & Testing

### Environment Variables

Create `.env` file in project root:

```bash
# .env (Never commit this to git!)
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-very-secret-key-here-change-this-in-production
DATABASE_URL=sqlite:///sca.db
MAX_CONTENT_LENGTH=16777216  # 16MB max file size
```

### Production Server Setup

```bash
# Install production WSGI server
pip install gunicorn

# Run with Gunicorn (4 workers, bind to all interfaces)
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --access-logfile - app:app

# Run with configuration file
gunicorn --config gunicorn_config.py app:app
```

### Gunicorn Configuration File

Create `gunicorn_config.py`:

```python
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(a)s"'
```

### Testing Before Deployment

```bash
# Run health check
curl http://localhost:5000/

# Test API endpoints
curl -X POST http://localhost:5000/api/predict-role \
  -H "Content-Type: application/json" \
  -d '{"resume_text":"Python, JavaScript, React..."}'

# Load testing (requires Apache Bench)
ab -n 1000 -c 10 http://localhost:5000/
```

---

## Deployment Options

### Option 1: Render (Recommended for Beginners)

Render is the easiest platform to deploy Flask apps.

**Step 1: Connect GitHub**
```bash
# Push to GitHub (see Git Commands section)
git push -u origin main
```

**Step 2: Create Render Service**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: `smart-career-advisor`
   - Environment: `Python 3.11`
   - Build command: `pip install -r requirements.txt && python train_model.py`
   - Start command: `gunicorn app:app`
   - Instance type: Standard ($7/month)

**Step 3: Add Environment Variables**
- Add `SECRET_KEY` in Render dashboard
- Add `FLASK_ENV=production`

**Step 4: Deploy**
- Click "Deploy" and wait 5-10 minutes
- Your app will be live at: `https://smart-career-advisor.onrender.com`

---

### Option 2: Railway

Railway offers free tier with student email.

**Step 1: Connect GitHub**
```bash
git push -u origin main
```

**Step 2: Deploy on Railway**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your SCA repository
5. Railway auto-detects Python and creates Procfile

**Step 3: Configure**
```bash
# Railway creates automatic Procfile
# But you can customize:
web: gunicorn -w 4 app:app
```

**Step 4: Set Environment Variables**
- Dashboard → Variables
- Add: `SECRET_KEY`, `FLASK_ENV=production`

**Step 5: Deploy**
- Auto-deploys on git push
- URL: `https://your-project-railway.up.railway.app`

---

### Option 3: AWS EC2 (Advanced)

For production-grade deployment with full control.

**Step 1: Launch EC2 Instance**
```bash
# Ubuntu 22.04 LTS, t3.small (1GB RAM, 1 vCPU)
# Security group: Allow HTTP (80), HTTPS (443), SSH (22)
```

**Step 2: SSH into Instance**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

**Step 3: Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3-pip python3-venv nginx -y

# Install git
sudo apt install git -y
```

**Step 4: Clone and Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/SCA.git
cd SCA

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
python train_model.py
```

**Step 5: Configure Nginx**
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/sca

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/sca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 6: Setup Gunicorn Service**
```bash
# Create systemd service
sudo nano /etc/systemd/system/sca.service

# Add:
[Unit]
Description=Smart Career Advisor
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/SCA
ExecStart=/home/ubuntu/SCA/venv/bin/gunicorn -w 4 app:app

[Install]
WantedBy=multi-user.target

# Start service
sudo systemctl start sca
sudo systemctl enable sca
```

**Step 7: SSL Certificate (Free with Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

### Option 4: Docker Deployment

For containerized deployment (any platform).

**Create Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Copy application
COPY . .

# Train models if needed
RUN python train_model.py

# Expose port
EXPOSE 5000

# Run with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

**Build and Run Locally:**
```bash
# Build image
docker build -t sca:latest .

# Run container
docker run -p 5000:5000 sca:latest

# Access: http://localhost:5000
```

**Deploy to Docker Hub:**
```bash
# Login
docker login

# Tag image
docker tag sca:latest yourusername/sca:latest

# Push
docker push yourusername/sca:latest

# Others can run:
docker run -p 5000:5000 yourusername/sca:latest
```

---

## CI/CD Pipelines

### GitHub Actions (Automated Testing & Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Smart Career Advisor

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: 3.11

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Lint with flake8
      run: |
        pip install flake8
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

    - name: Test with pytest
      run: |
        pip install pytest
        pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to Render
      run: |
        curl -X POST https://api.render.com/deploy/service/${{ secrets.RENDER_SERVICE_ID }} \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

**Setup:**
1. Add secrets to GitHub repo:
   - `RENDER_SERVICE_ID`
   - `RENDER_API_KEY`

2. Every push to `main` automatically:
   - Runs tests
   - Lints code
   - Deploys to Render

---

## Monitoring & Troubleshooting

### Health Check Endpoint

```python
# Add to app.py
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now()}), 200
```

### Monitoring Commands

```bash
# Check application logs (Render)
render logs -s smart-career-advisor

# Check application logs (Railway)
railway logs

# Check system resources (EC2)
top
free -h
df -h

# Check Gunicorn workers
ps aux | grep gunicorn

# Monitor requests (Nginx)
tail -f /var/log/nginx/access.log
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Gunicorn crashed | Check logs: `railway logs` |
| Timeout errors | Model loading slow | Increase timeout: `gunicorn --timeout 180` |
| Out of memory | Too many workers | Reduce workers: `-w 2` for 1GB RAM |
| Static files not loading | Nginx not configured | Add `location /static/` proxy |
| Database locked | Multiple processes accessing DB | Use PostgreSQL in production |

### Database Migration (SQLite → PostgreSQL)

For production, upgrade to PostgreSQL:

```python
# Install PostgreSQL driver
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost/sca

# SQLAlchemy automatically creates tables on first run
```

---

## Scaling for Production

### Performance Optimization

```python
# Add caching to app.py
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/profile', methods=['GET'])
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_profile():
    # Return user profile
    pass
```

### Load Balancing

```bash
# Use multiple Gunicorn workers across CPU cores
gunicorn -w $(nproc) app:app
```

### Database Connection Pooling

```python
# In app.py
from sqlalchemy.pool import QueuePool

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': QueuePool,
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}
```

---

## Cost Estimate (Monthly)

| Platform | Cost | Specs |
|----------|------|-------|
| **Render** | $7 | 1 vCPU, 0.5GB RAM, 500GB bandwidth |
| **Railway** | Free/$5+ | Free tier, then pay-as-you-go |
| **AWS EC2** | $10-20 | t3.small instance + data transfer |
| **Heroku** | $25+ | Dynos deprecated, use alternatives |

**Recommended:** Render (easiest, cheapest, reliable)

---

## Support & Documentation

- 📖 [Main README](README.md)
- 🔧 [Setup Guide](SETUP.md) - (if available)
- 🐛 Report issues on GitHub
- 💬 Check GitHub Discussions

---

## License

MIT License - see [LICENSE](LICENSE) file

---

<div align="center">

**Deploy with confidence**

Made for modern cloud infrastructure

</div>
