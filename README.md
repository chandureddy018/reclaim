# Re-Claim — Digital Lost & Found System
### Full Stack: Node.js + Express + MongoDB Atlas + Cloudinary

---

## What's Inside

```
reclaim/
├── server.js              ← Main server (start here)
├── package.json           ← All dependencies
├── .env.example           ← Copy this to .env and fill in your keys
├── models/
│   ├── User.js            ← User schema (bcrypt hashed passwords)
│   ├── Item.js            ← Lost/Found item schema
│   └── Chat.js            ← Chat message schema
├── routes/
│   ├── auth.js            ← Signup, signin, change credentials
│   ├── items.js           ← Submit, search, delete, resolve items
│   ├── admin.js           ← Admin-only: all users, stats, delete user
│   └── chat.js            ← Send and fetch messages
├── middleware/
│   ├── auth.js            ← JWT protect + adminOnly guards
│   ├── upload.js          ← Cloudinary image upload via multer
│   └── email.js           ← Nodemailer match + welcome emails
└── public/
    └── index.html         ← Complete frontend (served by Express)
```

---

## STEP 1 — Install Node.js

Download from https://nodejs.org (choose LTS version)
After installing, open terminal and verify:
```
node --version    → should show v18 or higher
npm --version     → should show 9 or higher
```

---

## STEP 2 — MongoDB Atlas (Free Database)

1. Go to https://cloud.mongodb.com and sign up free
2. Click **"Build a Database"** → choose **M0 Free Tier**
3. Choose a cloud provider (any) and click **Create**
4. Under **Security → Database Access**: create a user with username + password (save these)
5. Under **Security → Network Access**: click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
6. Go to **Database → Connect** → **Connect your application**
7. Copy the connection string — looks like:
   `mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
8. Replace `<password>` with your actual password and add `/reclaim` before the `?`:
   `mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/reclaim?retryWrites=true&w=majority`

---

## STEP 3 — Cloudinary (Free Image Upload)

1. Go to https://cloudinary.com and sign up free
2. After login, go to your **Dashboard**
3. Copy these three values:
   - Cloud name
   - API Key
   - API Secret

---

## STEP 4 — Gmail App Password (Email Notifications)

1. Use any Gmail account
2. Go to https://myaccount.google.com/security
3. Enable **2-Step Verification** if not already on
4. Search for **"App passwords"** and create one for "Mail"
5. Copy the 16-character password shown (e.g. `abcd efgh ijkl mnop`)

---

## STEP 5 — Set Up Your .env File

In the `reclaim` folder, copy `.env.example` to a new file called `.env`:

**Windows:**
```
copy .env.example .env
```
**Mac/Linux:**
```
cp .env.example .env
```

Open `.env` and fill in all values:

```env
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/reclaim?retryWrites=true&w=majority
JWT_SECRET=make_up_any_long_random_string_here_at_least_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@reclaim.com
ADMIN_PASSWORD=choose_a_strong_password
ADMIN_PHONE=9000000000
PORT=5000
FRONTEND_URL=http://localhost:5000
```

---

## STEP 6 — Install Dependencies & Run

Open terminal in the `reclaim` folder:

```bash
npm install
node server.js
```

You should see:
```
✅ MongoDB connected
✅ Admin account created: admin@reclaim.com
🚀 Re-Claim server running on http://localhost:5000
```

Open your browser and go to: **http://localhost:5000**

The app is running! Sign in with your admin credentials from `.env`.

---

## STEP 7 — Deploy Online (Free) so anyone can access it

### Deploy to Render (Recommended — Free)

1. Push your code to GitHub (create a repo, upload all files)
2. Go to https://render.com and sign up free
3. Click **New → Web Service** → connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Under **Environment Variables**, add all your `.env` values one by one
6. Click **Deploy** — Render gives you a URL like `https://reclaim-app.onrender.com`
7. Update `FRONTEND_URL` environment variable to this URL
8. Share the URL with everyone in your college!

---

## Security Features Built In

| Feature | How |
|---------|-----|
| Password hashing | bcrypt with 12 salt rounds |
| Authentication | JWT tokens (7 day expiry) |
| Admin protection | Server-side role check on every request |
| Rate limiting | 100 req/15min general, 10 req/15min on login |
| Input validation | express-validator on all routes |
| Image validation | Only jpg/png/webp, max 5MB |
| CORS | Restricted to your frontend URL |

---

## Default Admin Credentials

Set in your `.env` file before first run.
After first run, change them from the Admin Panel → Credentials tab.

---

## Troubleshooting

**MongoDB connection failed:**
→ Check your MONGO_URI in .env, make sure IP whitelist is set to 0.0.0.0/0

**Images not uploading:**
→ Check CLOUDINARY_* values in .env

**Emails not sending:**
→ Make sure Gmail 2FA is on and you used an App Password (not your regular password)

**Port already in use:**
→ Change PORT=5000 to PORT=5001 in .env

---

Built for Re-Claim IOP College Project
