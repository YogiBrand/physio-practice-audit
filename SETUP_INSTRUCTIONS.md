# Profit Calculator Setup Instructions

This guide will walk you through setting up email notifications and Google Sheets integration for your profit calculator.

## 🚀 Quick Start

1. Install dependencies
2. Set up EmailJS for email notifications
3. Set up Google Sheets integration
4. Configure your API keys
5. Test the integration

---

## 📦 Step 1: Install Dependencies

Run this command in your terminal:

```bash
cd "/Users/yogi/Downloads/Chiro Calculator/my-calculator"
npm install
```

This will install:
- `@emailjs/browser` - For sending emails
- `lucide-react` - For icons

---

## 📧 Step 2: Set Up EmailJS (Free Email Service)

EmailJS allows you to send emails directly from your React app without a backend server.

### 2.1 Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" (it's free - 200 emails/month)
3. Verify your email address

### 2.2 Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Click "Connect Account" and sign in
   - Or use SMTP settings for any email
4. Give it a name (e.g., "Clinic Calculator")
5. Copy the **Service ID** (you'll need this)

### 2.3 Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Template name: "Calculator Results"
4. Use this template content:

```
Subject: New Calculator Submission - {{clinic_name}}

New profit calculator submission received!

CLINIC INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clinic Name: {{clinic_name}}
Email: {{clinic_email}}
Clinic Type: {{clinic_type}}
Number of Providers: {{providers}}

CURRENT METRICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visits Per Week: {{visits_per_week}}
Revenue Per Visit: {{revenue_per_visit}}
Leads Per Month: {{leads_per_month}}
Show Rate: {{show_rate}}%
Lead-to-Book Rate: {{lead_to_book}}%
Package Attach Rate: {{package_attach}}%
Rebook Rate: {{rebook_rate}}%

PROJECTED RESULTS ({{scenario}} Scenario):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Additional Revenue: {{additional_revenue}}
📈 Additional Profit: {{additional_profit}}
🏆 Valuation Impact: {{valuation_impact}}
⚠️  Total Current Waste: {{total_waste}}
💸 Daily Waste: {{daily_waste}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to this email to follow up with {{clinic_name}}
```

5. Click **Save**
6. Copy the **Template ID**

### 2.4 Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. Copy it

---

## 📊 Step 3: Set Up Google Sheets Integration

### 3.1 Create a Google Sheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: "Profit Calculator Leads"
4. Create these column headers in Row 1:
   ```
   Timestamp | Clinic Name | Email | Clinic Type | Providers | Visits/Week | Revenue/Visit | Leads/Month | Show Rate | Lead-to-Book | Package Attach | Rebook Rate | Scenario | Additional Revenue | Additional Profit | Valuation Impact | Total Waste | Daily Waste
   ```

### 3.2 Create Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Add row to sheet
    sheet.appendRow([
      data.timestamp,
      data.clinicName,
      data.email,
      data.clinicType,
      data.providers,
      data.visitsPerWeek,
      data.revenuePerVisit,
      data.leadsPerMonth,
      data.currentShowRate,
      data.currentLeadToBook,
      data.currentPackageAttach,
      data.currentRebookRate,
      data.scenario,
      data.additionalRevenue,
      data.additionalGrossProfit,
      data.valuationImpact,
      data.totalCurrentWaste,
      data.dailyWaste
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾 icon)
5. Click **Deploy** → **New deployment**
6. Click the gear icon ⚙️ → Select **Web app**
7. Settings:
   - Description: "Calculator Data Collector"
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. **Copy the Web App URL** (it will look like: `https://script.google.com/macros/s/XXXXXX/exec`)
10. Click **Authorize access** if prompted and grant permissions

---

## 🔧 Step 4: Configure Your API Keys

Now open the file `/Users/yogi/Downloads/Chiro Calculator/my-calculator/src/App.js` and replace these placeholder values:

### Line 164 - EmailJS Public Key
```javascript
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
```
Replace `YOUR_EMAILJS_PUBLIC_KEY` with your actual public key from Step 2.4

### Lines 167-168 - EmailJS Service and Template IDs
```javascript
await emailjs.send(
  'YOUR_SERVICE_ID',      // Replace with your Service ID from Step 2.2
  'YOUR_TEMPLATE_ID',     // Replace with your Template ID from Step 2.3
```

### Line 115 - Google Sheets URL
```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
```
Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with the URL from Step 3.2

---

## ✅ Step 5: Test Everything

### 5.1 Start Your App
```bash
npm start
```

### 5.2 Test the Form
1. Fill out all fields including clinic name and email
2. Click "Calculate My Profit Potential"
3. You should see "⏳ Calculating & Sending Results..."

### 5.3 Verify
1. **Check your email** (sjbedecki@gmail.com) - you should receive the calculator results
2. **Check your Google Sheet** - a new row should appear with the submission data

---

## 🎯 Example Configuration

Here's what your configured lines should look like (with example values):

```javascript
// Line 164
emailjs.init('kp3Xm_9jKL2nP5QwX');  // Your actual public key

// Lines 167-168
await emailjs.send(
  'service_abc1234',    // Your service ID
  'template_xyz5678',   // Your template ID
  
// Line 115
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXXXXXXXXXXX/exec';
```

---

## 🛠️ Troubleshooting

### Email Not Sending?
1. Check EmailJS dashboard → **Logs** to see errors
2. Verify your Service ID and Template ID are correct
3. Make sure you initialized EmailJS with your public key
4. Check browser console for errors (F12)

### Google Sheets Not Working?
1. Make sure your Apps Script is deployed as "Anyone" can access
2. Check that the URL ends with `/exec` not `/dev`
3. Look at Apps Script **Executions** log for errors
4. Verify column headers match exactly

### Validation Errors?
The form requires:
- Clinic Name (not empty)
- Valid email address format
- All numeric fields > 0

---

## 🔒 Security Notes

- Your EmailJS public key is safe to expose in frontend code
- The Google Script URL is publicly accessible but only accepts POST requests
- Consider adding rate limiting if you get spam submissions
- EmailJS free tier: 200 emails/month (upgrade available)

---

## 📈 Next Steps

Once everything is working:

1. **Customize the email template** in EmailJS to match your branding
2. **Add more columns** to your Google Sheet if needed
3. **Set up email notifications** in Google Sheets (Tools → Notification rules)
4. **Create a pivot table** in Sheets to analyze your leads
5. **Consider upgrading EmailJS** if you get more than 200 submissions/month

---

## 💡 Pro Tips

1. **Test with your own email first** before going live
2. **Set up a backup email** in EmailJS service settings
3. **Export your Google Sheet** regularly as backup
4. **Monitor your EmailJS quota** in the dashboard
5. **Add Google Analytics** tracking for form submissions

---

## 📞 Need Help?

If you run into issues:
1. Check the browser console (F12) for error messages
2. Review EmailJS logs in their dashboard
3. Check Google Apps Script execution logs
4. Make sure all API keys are correctly copied

---

## ✨ You're All Set!

Your profit calculator now:
- ✅ Captures clinic name and email
- ✅ Validates all fields before showing results
- ✅ Automatically emails you when someone submits
- ✅ Saves all data to Google Sheets
- ✅ Shows professional loading states

Start collecting leads! 🚀

