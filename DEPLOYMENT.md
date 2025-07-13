# 🚀 Deployment Guide for Panda Battle Royale

This is a **Node.js server application** with Socket.IO for real-time multiplayer gaming. It **cannot** be deployed to static hosting services like Netlify or Vercel.

## ✅ Recommended Hosting Platforms

### 1. **Render (FREE)** ⭐ Recommended
- **Cost**: Free tier available
- **Setup**: 
  1. Push code to GitHub
  2. Connect Render to your GitHub repo
  3. Render will auto-detect Node.js and use `render.yaml`
  4. Deploy automatically
- **URL**: `https://your-app-name.onrender.com`

### 2. **Railway (FREE)** 
- **Cost**: Free tier with usage limits
- **Setup**:
  1. Push code to GitHub
  2. Connect Railway to your repo
  3. Uses `railway.json` config
  4. Automatic deployments
- **URL**: `https://your-app-name.up.railway.app`

### 3. **Heroku**
- **Cost**: No longer has free tier (~$7/month)
- **Setup**:
  ```bash
  heroku create your-app-name
  git push heroku main
  ```
- Uses `Procfile` for configuration

### 4. **DigitalOcean App Platform**
- **Cost**: $5/month minimum
- **Setup**: Connect GitHub repo, auto-deploys

### 5. **Docker Deployment** (VPS/Cloud)
```bash
docker build -t panda-battle-royale .
docker run -p 3000:3000 panda-battle-royale
```

## 🎯 Quick Deploy to Render (FREE)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push origin main
   ```

2. **Create Render Account**: 
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Deploy**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Render will use the `render.yaml` config automatically
   - Click "Deploy"

4. **Access**: 
   - Your game will be live at `https://your-repo-name.onrender.com`

## 🔧 Environment Variables

Set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=10000` (or whatever your host requires)

## 📁 Required Files for Deployment

✅ All deployment files have been created:
- `render.yaml` - Render configuration
- `railway.json` - Railway configuration  
- `Procfile` - Heroku configuration
- `Dockerfile` - Docker configuration
- `package.json` - Updated with engines and scripts

## 🚫 Why Netlify Won't Work

- **Netlify** = Static file hosting (HTML, CSS, JS files only)
- **Your Game** = Node.js server with Socket.IO (requires server runtime)
- **Solution** = Use a platform that supports Node.js servers

## 🎮 Testing Your Deployment

After deployment:
1. Visit your deployed URL
2. Enter a player name and select a panda color
3. You should see the 3D environment with trees, bridges, fences
4. Test multiplayer by opening multiple browser tabs
5. Try shooting rockets at objects and other players

## 🔄 Auto-Deployment

Most platforms will auto-deploy when you push to your main branch:
```bash
git add .
git commit -m "Update game features"
git push origin main
```

## 📞 Support

If you encounter issues:
1. Check the platform's build logs
2. Ensure all files are committed to Git
3. Verify Node.js version compatibility (>=16.0.0)