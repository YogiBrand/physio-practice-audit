# 🚀 Quick Start Guide - Lead Capture Setup

Your profit calculator has been upgraded with **automatic email notifications** and **Google Sheets data collection**!

## 📊 What Changed?

✅ **Clinic Name & Email fields** added (required)  
✅ **Form validation** - can't see results without filling everything  
✅ **Automatic email** sent to sjbedecki@gmail.com with all results  
✅ **Google Sheets** integration to save every submission  
✅ **Professional UI** with loading states and error messages

---

## ⚡ 3-Minute Setup

### Step 1: Install Dependencies (30 seconds)
```bash
cd "/Users/yogi/Downloads/Chiro Calculator/my-calculator"
npm install --legacy-peer-deps
```

### Step 2: EmailJS Setup (1 minute)
1. Go to [emailjs.com](https://emailjs.com) → Sign up (FREE)
2. Add email service (connect Gmail)
3. Create email template (copy from SETUP_INSTRUCTIONS.md)
4. Copy: **Public Key**, **Service ID**, **Template ID**

### Step 3: Google Sheets Setup (1 minute)
1. Create new Google Sheet
2. Add column headers (see SETUP_INSTRUCTIONS.md)
3. Extensions → Apps Script → paste code (from SETUP_INSTRUCTIONS.md)
4. Deploy as Web App → Copy URL

### Step 4: Add Your Keys (30 seconds)
Open `src/App.js` and replace:
- Line 164: `YOUR_EMAILJS_PUBLIC_KEY`
- Line 167: `YOUR_SERVICE_ID`
- Line 168: `YOUR_TEMPLATE_ID`
- Line 115: `YOUR_GOOGLE_APPS_SCRIPT_URL`

### Step 5: Test It! (1 minute)
```bash
npm start
```
Fill out the form and submit. You'll get an email and see data in Google Sheets!

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `SETUP_INSTRUCTIONS.md` | **Complete step-by-step guide** with screenshots and examples |
| `CONFIG_TEMPLATE.txt` | Simple template to track your API keys |
| `QUICK_START.md` | This file - quick reference |

---

## 🎯 How It Works

1. **User fills form** → Clinic name, email, and all metrics
2. **Clicks Calculate** → Form validates (all fields required)
3. **Email sent** → You get notified at sjbedecki@gmail.com with full results
4. **Data saved** → Google Sheet gets a new row with timestamp
5. **Results shown** → User sees their profit analysis

---

## 🔍 Testing Checklist

Before going live, test these:

- [ ] Form won't submit without clinic name
- [ ] Form won't submit without valid email
- [ ] Form won't submit with any empty numeric fields
- [ ] Loading spinner shows during submission
- [ ] Results appear after submission
- [ ] Email arrives at sjbedecki@gmail.com
- [ ] New row appears in Google Sheet
- [ ] All data in email matches form inputs

---

## 🛟 Troubleshooting

**"EmailJS not found" error?**
→ Run: `npm install --legacy-peer-deps` again

**Email not sending?**
→ Check EmailJS dashboard logs for errors

**Google Sheets not working?**
→ Verify Apps Script is deployed with "Anyone" access

**Validation error showing?**
→ This is normal - make sure all fields are filled

---

## 📞 Support

For detailed help, see **SETUP_INSTRUCTIONS.md** - it has:
- Screenshots and examples
- Troubleshooting section
- Pro tips and best practices
- Security notes

---

## 🎨 Customization Ideas

Once working, you can:
- Change email template design in EmailJS
- Add more columns to Google Sheet
- Customize validation messages in App.js
- Add Google Analytics tracking
- Set up Zapier automations from the sheet

---

## 💰 Cost

**100% FREE** for typical usage:
- EmailJS: 200 emails/month free (upgrade $8/mo for more)
- Google Sheets: Free unlimited
- Hosting: Use Netlify, Vercel, or GitHub Pages (free)

---

## 🚀 Deploy When Ready

Build for production:
```bash
npm run build
```

Deploy the `build` folder to:
- **Netlify**: Drag & drop the build folder
- **Vercel**: Connect your repo
- **GitHub Pages**: Use gh-pages package

---

**Need help? Check SETUP_INSTRUCTIONS.md for the complete guide!** 📖

