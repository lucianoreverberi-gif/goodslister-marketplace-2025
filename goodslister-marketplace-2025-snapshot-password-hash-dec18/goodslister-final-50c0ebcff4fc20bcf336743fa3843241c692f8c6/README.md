<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Goodslister Marketplace

This is the repository for the Goodslister AI-Powered Marketplace.

## 🚀 How to Go Live (Deployment Guide)

To make your application fully functional for users worldwide, follow these steps on Vercel.

### 1. Connect the Project
1. Import this repository into Vercel.
2. Select **Vite** as the Framework Preset.
3. **Root Directory:** Click "Edit" and select the folder `goodslister-final-...`.
4. Add your `API_KEY` (Gemini) in Environment Variables.
5. Deploy.

### 2. Enable Image Uploads (Storage)
1. Go to your project dashboard in Vercel.
2. Click on the **Storage** tab.
3. Click **Create Database** (Black button, top right).
4. Select **Blob** from the list and click Continue.
5. Name it `goodslister-images` and connect it to your project.

### 3. Enable Real Database (Postgres)
1. While in the **Storage** tab, click **Create Database** again.
2. Select **Postgres** (Serverless SQL).
3. Click **Continue** and follow the prompts to create and connect it.

### 4. Final Step: Redeploy
After connecting Storage and Postgres, Vercel adds new environment variables (hidden keys) to your project. For the app to see them:
1. Go to the **Deployments** tab.
2. Find your latest deployment (the top one).
3. Click the **three dots (⋮)** button on the right -> **Redeploy**.

Your app is now live with a real cloud backend!

## Run Locally

1. Install dependencies:
   `npm install`
2. Set the `API_KEY` in `.env.local` to your Gemini API key.
3. Run the app:
   `npm run dev`
