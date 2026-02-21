# Deployment Guide

ForexPulse is built using **Vite**, which makes deployment to modern cloud platforms like Vercel and Netlify extremely simple.

## Prerequisites

1. A **GitHub**, **GitLab**, or **Bitbucket** repository containing your code.
2. An account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com).

## Deployment Settings

Regardless of the platform, you will need the following build settings:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## 1. Deploying to Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New"** > **"Project"**.
3. Import your Git repository.
4. Vercel will automatically detect **Vite**.
5. Ensure the **Output Directory** is set to `dist`.
6. Click **"Deploy"**.

### Vercel Pro-Tip: SPA Routing

Since ForexPulse is a Single Page Application (SPA), you may need a `vercel.json` in your root directory if you use persistent URLs (though our current routing is hash-based/state-based):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 2. Deploying to Netlify

1. Log in to the [Netlify App](https://app.netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Connect your Git provider and select your repository.
4. Set the following Build Settings:
   - **Base directory**: (Leave empty or `/` if in root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Deploy site"**.

---

## 3. Environment Variables

If you have sensitive API keys (e.g., for a real live broker or a premium data provider), **do not hardcode them** in `api.js`. Use environment variables:

1. Create a `.env` file (locally):
   ```env
   VITE_BROKER_API_KEY=your_secret_key
   ```
2. Access it in code:
   ```javascript
   const apiKey = import.meta.env.VITE_BROKER_API_KEY;
   ```
3. Add the same key in your Vercel/Netlify dashboard under **Settings > Environment Variables**.

---

## 4. Local Build Check

Before deploying, always run a local build check:

```bash
npm run build
npx vite preview
```

This allows you to see exactly what the production app will look like and catch any path errors.
