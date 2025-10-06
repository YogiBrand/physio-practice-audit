# 💪 Physiotherapy Profit Leak Calculator

This is the **Physiotherapy-specific** version of your profit calculator.

## ✨ What's Different

- ✅ **Fixed clinic type**: Set to "Physiotherapy" (no dropdown needed)
- ✅ **Cleaner form**: Clinic name and email fields inline with other inputs
- ✅ **Physio-specific calculations**: Uses 6 visits per patient base + 3 visit package bonus
- ✅ **Branded for physiotherapists**: "Physiotherapy Profit Leak Calculator" title

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd "/Users/yogi/Downloads/Chiro Calculator/physio-calculator"
npm install --legacy-peer-deps
```

### 2. Configure Your API Keys

Open `src/App.js` and update these values:

**Line 115** - Google Sheets URL:
```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
```

**Line 164** - EmailJS Public Key:
```javascript
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
```

**Lines 167-168** - EmailJS Service & Template:
```javascript
await emailjs.send(
  'YOUR_SERVICE_ID',
  'YOUR_TEMPLATE_ID',
```

### 3. Run Development Server
```bash
npm start
```

The app will open at http://localhost:3000

### 4. Build for Production
```bash
npm run build
```

Deploy the `build` folder to any hosting service (Netlify, Vercel, etc.)

## 📧 Email & Data Collection

This calculator automatically:
- ✅ Sends you an email at `sjbedecki@gmail.com` with full results
- ✅ Saves data to your Google Sheets
- ✅ Requires clinic name & email before showing results

## 🎯 Form Fields

- **Clinic Name** (required)
- **Email Address** (required)
- Number of Providers
- Total Visits Per Week
- Avg Revenue Per Visit
- New Leads Per Month
- Show Rate %
- Lead-to-Book %
- Package Attach %
- Rebook Rate %

## 📊 Calculations

Uses physiotherapy-specific metrics:
- **Base visits per patient**: 6 visits
- **Package bonus visits**: +3 visits
- **Gross margin**: 68%
- **Valuation multiple**: 3.5x EBITDA

## 🔗 Related Files

- **Chiropractic Version**: `/chiro-calculator/` folder
- **Setup Instructions**: `SETUP_INSTRUCTIONS.md`
- **Configuration Guide**: `CONFIG_TEMPLATE.txt`

## 📝 Notes

- This version is hardcoded for physiotherapy clinics
- All EmailJS and Google Sheets setup is identical to the chiro version
- You can use the same or different EmailJS templates for each version
- Consider using different Google Sheets to track each specialty separately

---

**Need help?** Check `SETUP_INSTRUCTIONS.md` for detailed configuration steps.

