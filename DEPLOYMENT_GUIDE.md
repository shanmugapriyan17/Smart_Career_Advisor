# Smart Career Advisor - Deployment Guide

Deploy Flask backend to **Render** and frontend to **Vercel** from a single GitHub repository.

---

# Repository Structure

```
Smart_Career_Advisor/
├── app.py                    (Flask backend)
├── train_model.py            (ML model training)
├── requirements.txt          (Python dependencies)
├── runtime.txt              (Python 3.11.9)
├── Procfile                 (Render startup command)
├── models/                  (ML model files)
├── data/                    (Training data)
├── static/                  (Backend static assets)
├── templates/               (Backend Flask templates)
├── sca.db                   (SQLite database)
├── frontend/                ← FRONTEND FOR VERCEL
│   ├── index.html
│   ├── dashboard.html
│   ├── resume_analyzer.html
│   ├── about.html
│   ├── css/
│   ├── js/
│   ├── IMG/
│   └── .gitignore
└── DEPLOYMENT_GUIDE.md
```

---

# PART 1: BACKEND DEPLOYMENT (RENDER)

## Step 1: Prepare Repository

**Action:** Push this repository to GitHub (if not already done)

```powershell
cd "E:\R PROJECT\new\SCA"
git add .
git commit -m "Smart Career Advisor - ready for deployment"
git push origin main
```

---

## Step 2: Go to Render

**Action:**
1. Open https://render.com in your browser
2. Click **"Sign Up"** (top right)
3. Click **"Continue with GitHub"**
4. Authorize Render to access your GitHub repos

---

## Step 3: Create Web Service

**Action:**
1. Click **"New +"** button (top right)
2. Click **"Web Service"**
3. Select repo: `Smart_Career_Advisor`
4. If you don't see it, click **"Connect account"** and try again

---

## Step 4: Configure Service

**Action:** Fill in these fields:

| Field | Enter This |
|-------|-----------|
| **Name** | `sca-backend` |
| **Environment** | `Python 3` |
| **Region** | `Frankfurt` (or nearest) |
| **Branch** | `main` |
| **Root Directory** | `.` (repo root) |
| **Build Command** | `pip install -r requirements.txt && python train_model.py` |
| **Start Command** | `gunicorn app:app` |

**Leave everything else as default.**

---

## Step 5: Deploy

**Action:**
1. Click **"Create Web Service"** (blue button)
2. Wait 5-10 minutes for deployment
3. Look for a green checkmark with URL: `https://sca-backend.onrender.com`

**Save this URL. You need it for frontend.**

---

## Step 6: Test Backend

**Action:**
1. Copy your backend URL
2. Open it in your browser
3. You should see Flask app load

✅ **Backend is live!**

---

---

# PART 2: FRONTEND DEPLOYMENT (VERCEL)

## Step 1: Sign Up to Vercel

**Action:**
1. Open https://vercel.com
2. Click **"Sign Up"** (top right)
3. Click **"Continue with GitHub"**
4. Authorize Vercel

---

## Step 2: Deploy on Vercel

**Action:**
1. Click **"Add New"** → **"Project"**
2. Select repo: `Smart_Career_Advisor`
3. Click **"Configure Project"**
4. Set:
   - **Root Directory**: `frontend`
   - **Framework**: `Other`
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`
5. Click **"Deploy"**
6. Wait 2-5 minutes
7. Copy frontend URL: `https://sca-frontend-xxx.vercel.app`

✅ **Frontend is live!**

---

---

# PART 3: VERIFY CONNECTION

## Step 1: Test Backend URL

**Action:**
1. Open your Render backend URL
2. Page should load (or show 404 - that's okay, means Flask is running)

---

## Step 2: Test Frontend URL

**Action:**
1. Open your Vercel frontend URL
2. Page should load with home page visible

---

## Step 3: Verify CORS

**Action:**
1. Open frontend URL
2. Press **F12** → **Console** tab
3. Paste and run:

```javascript
fetch('https://sca-backend.onrender.com/').then(r => r.text()).then(t => console.log('Backend OK'))
```

**Expected:** You see `Backend OK` in console ✅

---

## Step 4: Test Full Flow

**Action:**
1. On frontend, try to **Login** or **Sign Up**
2. Go to **Resume Analyzer**
3. Upload a resume PDF or TXT
4. Click **"Predict"**
5. You should see a job prediction returned

**Expected:** Prediction shows (e.g., "Data Scientist") ✅

---

---

# TROUBLESHOOTING

## ❌ CORS Error in Console

**Fix:**
1. Verify CORS is enabled in backend `app.py`:
   ```python
   from flask_cors import CORS
   CORS(app)
   ```
2. Commit and push to GitHub
3. Render auto-redeploys (5 min)
4. Hard refresh frontend (Ctrl+Shift+R)

---

## ❌ Backend shows "Cannot GET /"

**This is normal on Render.** It means Flask is running.

The app may take 20-30 seconds to wake up on free tier.

---

## ❌ Frontend shows 404 on pages

**Fix:**
1. Verify all HTML files are in `/frontend`:
   - `index.html`
   - `dashboard.html`
   - `resume_analyzer.html`
   - `about.html`
2. Check with: `ls E:\R PROJECT\new\SCA\frontend\*.html`
3. If missing, copy them manually
4. Push to GitHub and wait for Vercel redeploy

---

## ❌ "Failed to fetch" error in Console

**Fix:**
1. Check API_BASE in `/frontend/js/main.js`:
   ```javascript
   const API_BASE = 'https://sca-backend.onrender.com';
   ```
2. Verify your backend URL matches
3. Check Network tab (F12) to see actual request URL
4. Ensure backend is running (visit its URL)

---

---

# SUMMARY

| Component | Platform | URL |
|-----------|----------|-----|
| **Backend (Flask + ML)** | Render | `https://sca-backend.onrender.com` |
| **Frontend (HTML/CSS/JS)** | Vercel | `https://sca-frontend.vercel.app` |
| **Database** | SQLite on Render | Stored in container |

---

# FINAL NOTES

- **Free tier limits:**
  - Render: Spins down after 15 min idle (wakes up on first visit, takes 20 sec)
  - Vercel: No idle limits (always fast)

- **Updates:**
  - Backend: Push to GitHub → Render auto-redeploys (5 min)
  - Frontend: Push to GitHub → Vercel auto-redeploys (2 min)

- **Single repository:**
  - Both backend and frontend deploy from: `https://github.com/shanmugapriyan17/Smart_Career_Advisor`
  - Backend uses root directory
  - Frontend uses `/frontend` directory

---

**Your Smart Career Advisor is live! 🎉**
