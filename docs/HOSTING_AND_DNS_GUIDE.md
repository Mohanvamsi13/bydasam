# BYDASAM.COM — Complete Hosting + DNS Guide
> Stack: React → Cloudflare Pages (free) · Node.js → Render (free) · MongoDB Atlas (free) · Cloudinary (free)
> Domain: bydasam.com bought on Namecheap

---

## STEP 1 — Install Node.js

1. Go to **https://nodejs.org** → Download LTS version
2. Install it (Next → Next → Finish)
3. Open terminal (Windows: Win+R → type `cmd` → Enter)
4. Confirm: `node --version` → should show v20.x.x

---

## STEP 2 — Install Git

1. Go to **https://git-scm.com/downloads** → Download
2. Install with default settings
3. Confirm: `git --version`

---

## STEP 3 — Create GitHub account & upload code

1. Go to **https://github.com** → Sign Up (free)
2. Click **+** → **New repository** → name it `bydasam` → Public → Create
3. In terminal, go into your project folder:
   ```bash
   cd bydasam
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bydasam.git
   git push -u origin main
   ```

---

## STEP 4 — MongoDB Atlas (free database, no card)

1. Go to **https://www.mongodb.com/cloud/atlas** → Sign Up free
2. Choose **M0 Free tier** → any region → Create
3. **Security → Database Access** → Add user:
   - Username: `bydasamuser` · Password: something strong → save it
   - Role: Atlas Admin
4. **Security → Network Access** → Add IP → **0.0.0.0/0** (allow everywhere)
5. **Deployment → Database** → Connect → Drivers → copy string:
   ```
   mongodb+srv://bydasamuser:PASSWORD@cluster0.xxxxx.mongodb.net/bydasam?retryWrites=true&w=majority
   ```
   Save this — it's your `MONGODB_URI`

---

## STEP 5 — Cloudinary (free photo storage, no card)

1. Go to **https://cloudinary.com** → Sign Up free
2. Dashboard shows 3 values → save all:
   - **Cloud Name** · **API Key** · **API Secret**

---

## STEP 6 — Deploy Backend on Render (free, NO card)

1. Go to **https://render.com** → Sign Up with GitHub
2. **New → Web Service** → Connect `bydasam` repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
4. **Environment Variables** → add all these:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas string from Step 4 |
   | `JWT_SECRET` | any long random text (e.g. `bydasam_jwt_secret_abc123xyz`) |
   | `CLOUDINARY_CLOUD_NAME` | from Step 5 |
   | `CLOUDINARY_API_KEY` | from Step 5 |
   | `CLOUDINARY_API_SECRET` | from Step 5 |
   | `EMAIL_USER` | your Gmail address |
   | `EMAIL_PASS` | Gmail App Password (see note below) |
   | `NOTIFY_EMAIL` | your Gmail address |
   | `ADMIN_EMAIL` | `admin@bydasam.com` |
   | `ADMIN_PASSWORD` | A strong password you'll remember |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://bydasam.com` |

5. Click **Create Web Service** → wait for deploy (~3 min)
6. You get a URL like: `https://bydasam-api.onrender.com` — **save this**

> **Gmail App Password:** Google Account → Security → 2-Step Verification (turn on) → App Passwords → generate one → use the 16 letters as `EMAIL_PASS`

### Create admin account (do this once after deploy)

Open your terminal and run:
```bash
curl -X POST https://bydasam-api.onrender.com/api/auth/seed
```
This creates your admin login using the email/password you set above.

---

## STEP 7 — Deploy Frontend on Cloudflare Pages (free, NO card)

1. Go to **https://pages.cloudflare.com** → Sign Up with GitHub
2. **Create a project** → Connect to Git → select `bydasam`
3. Settings:
   - **Framework preset:** Vite
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://bydasam-api.onrender.com/api` |
5. Click **Save and Deploy**
6. You get a free URL: `https://bydasam.pages.dev`

---

## STEP 8 — Connect bydasam.com from Namecheap (THE DNS STEP)

This is how you make `bydasam.com` point to your Cloudflare Pages site.

### Option A — Use Cloudflare for DNS (recommended — fastest & free)

1. Go to **https://cloudflare.com** → Sign Up free (same account as Pages)
2. **Add a site** → type `bydasam.com` → select **Free plan**
3. Cloudflare scans your DNS and shows existing records
4. Click **Continue**
5. Cloudflare gives you **2 nameservers**, like:
   ```
   aria.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
6. Go to **Namecheap** → log in → **Domain List** → click **Manage** next to `bydasam.com`
7. Under **Nameservers** → change dropdown from "Namecheap BasicDNS" to **Custom DNS**
8. Enter the 2 Cloudflare nameservers → Save (green checkmark)
9. Back in Cloudflare → click **Done, check nameservers**
10. Wait 15–30 minutes for DNS to update
11. In Cloudflare → **Workers & Pages** → your bydasam project → **Custom Domains**
12. Click **Set up a custom domain** → type `bydasam.com` → Activate domain
13. Also add `www.bydasam.com` → it will auto-redirect to the main domain
14. Cloudflare adds HTTPS automatically — your site is live at **https://bydasam.com** 🎉

### Option B — Keep Namecheap DNS (simpler but slightly slower)

1. In Cloudflare Pages → your project → **Custom Domains** → Add `bydasam.com`
2. Cloudflare shows you a CNAME record to add
3. Go to Namecheap → **Domain List** → Manage → **Advanced DNS** tab
4. Delete any existing A or CNAME records for `@` and `www`
5. Add new record:
   - Type: `CNAME` · Host: `@` · Value: `bydasam.pages.dev` · TTL: Auto
   - Type: `CNAME` · Host: `www` · Value: `bydasam.pages.dev` · TTL: Auto
6. Save → wait 30 min → your site works at `https://bydasam.com`

**Recommendation: Use Option A** — it's faster, gives you more control, and Cloudflare's DNS is the fastest in the world.

---

## STEP 9 — Update CORS for your domain

After your domain is live, go to Render → your service → Environment → update:
```
FRONTEND_URL = https://bydasam.com
```
Then redeploy (Render does this automatically).

---

## STEP 10 — Log into your Admin Panel

Go to: **https://bydasam.com/admin/login**

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in Step 6.

From the admin panel you can:
- Upload your photos and assign categories
- Add/remove portfolio categories
- Manage services and pricing
- View and confirm booking requests
- Update social media links
- Change site settings

---

## STEP 11 — Updating your site in the future

Whenever you change code:
```bash
git add .
git commit -m "what I changed"
git push
```
Cloudflare Pages and Render both redeploy automatically. Takes about 1–2 minutes.

---

## Summary — Everything Free

| What | Service | Cost |
|------|---------|------|
| Frontend hosting | Cloudflare Pages | Free forever |
| Backend hosting | Render | Free (sleeps after 15min idle) |
| Database | MongoDB Atlas | Free forever (512MB) |
| Photo storage | Cloudinary | Free (25GB) |
| Code storage | GitHub | Free forever |
| Domain DNS | Cloudflare | Free forever |
| HTTPS/SSL | Cloudflare | Free forever |
| **Domain name** | **Namecheap** | **~€10/year (only paid thing)** |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows "Application error" | Check Render logs → likely a missing env variable |
| Photos not uploading | Double-check all 3 Cloudinary env vars are correct |
| Can't log into admin | Make sure you ran the `/api/auth/seed` curl command |
| `bydasam.com` not working | DNS takes up to 48h, but usually 30 min. Check Cloudflare dashboard. |
| Bookings not sending email | Use Gmail App Password, not your regular password |
| Backend slow first load | Normal — Render free tier sleeps after 15min. First request wakes it (~30s). |

---

Questions? Ask Claude anytime!
