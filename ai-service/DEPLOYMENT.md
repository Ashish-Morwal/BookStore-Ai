# AI Service - Deployment Guide

## Deploy to Render

### 1. Create New Web Service
- Go to [Render Dashboard](https://dashboard.render.com/)
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository

### 2. Configuration Settings

**General:**
- **Name**: `bookstore-ai-service` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `ai-service`

**Build & Deploy:**
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### 3. Environment Variables
Add these in Render dashboard:

```
HF_API_TOKEN=your_huggingface_api_token_here
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=your_mongodb_connection_string_here
```

**How to get your Hugging Face API token:**
1. Go to https://huggingface.co and create a free account
2. Navigate to Settings → Access Tokens: https://huggingface.co/settings/tokens
3. Click **"New token"** → Create a **"Read"** token
4. Copy the token and paste it as `HF_API_TOKEN` in Render environment variables


### 4. Instance Type
- **Free** tier is fine for testing
- **Starter** or higher for production

### 5. Deploy!
Click **"Create Web Service"** and wait for deployment.

---

## After Deployment

### Update Backend Service
Once AI service is deployed, update your backend's environment variable:

1. Go to your backend service on Render
2. Add/Update environment variable:
   ```
   AI_SERVICE_URL=https://your-ai-service-name.onrender.com
   ```
3. The backend will auto-redeploy

### Test the Deployment
1. Visit: `https://your-ai-service-name.onrender.com/`
2. You should see: `{"status": "Bookstore AI Service running"}`
3. Check `/docs` for API documentation: `https://your-ai-service-name.onrender.com/docs`

---

## Troubleshooting

### Build Fails
- Check that `requirements.txt` is in `ai-service` folder
- Verify Python version compatibility (3.10+)

### Service Won't Start
- Check environment variables are set correctly (especially `HF_API_TOKEN`)
- View logs in Render dashboard
- Verify MongoDB connection string

### Out of Memory Errors
- **Free tier** has 512MB RAM limit
- We use Hugging Face API for embeddings to stay within this limit
- If still having issues, consider upgrading to **Starter** plan ($7/month)

### Streaming Not Working
- Ensure backend `AI_SERVICE_URL` points to deployed service
- Check CORS settings (already configured in `app.py`)

---

## Health Check
The service has a health endpoint at `/` that returns:
```json
{"status": "Bookstore AI Service running"}
```

Use this for monitoring or health checks.
