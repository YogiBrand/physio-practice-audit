import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertCircle, DollarSign, Users, Award, CheckCircle, Mail, ArrowRight } from 'lucide-react';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ClinicProfitCalculator = () => {
  const [inputs, setInputs] = useState({
    clinicName: '',
    email: '',
    clinicType: 'physio', // Fixed to physiotherapy
    providers: 3,
    visitsPerWeek: 90,
    revenuePerVisit: 95,
    leadsPerMonth: 120,
    currentShowRate: 75,
    currentLeadToBook: 35,
    currentPackageAttach: 15,
    currentRebookRate: 25
  });

  const [scenario, setScenario] = useState('expected');
  const [showResults, setShowResults] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const improvements = {
    conservative: { showRate: 5, leadToBook: 8, packageAttach: 8, rebookRate: 8, label: 'Conservative', color: '#10b981' },
    expected: { showRate: 10, leadToBook: 12, packageAttach: 12, rebookRate: 12, label: 'Expected', color: '#3b82f6' },
    aggressive: { showRate: 15, leadToBook: 15, packageAttach: 18, rebookRate: 18, label: 'Aggressive', color: '#0ea5e9' }
  };

  const currentImprovement = improvements[scenario];

  const calculations = useMemo(() => {
    const weeksPerYear = 52;
    const currentAnnualVisits = inputs.visitsPerWeek * weeksPerYear;
    const currentAnnualRevenue = currentAnnualVisits * inputs.revenuePerVisit;
    const currentBookedLeads = inputs.leadsPerMonth * 12 * (inputs.currentLeadToBook / 100);
    const currentShownVisits = currentBookedLeads * (inputs.currentShowRate / 100);
    const currentNoShows = currentBookedLeads - currentShownVisits;
    const currentPackagePatients = currentShownVisits * (inputs.currentPackageAttach / 100);
    const baseVisitsPerPatient = inputs.clinicType === 'chiro' ? 8 : 6;
    const packageVisitsBonus = inputs.clinicType === 'chiro' ? 4 : 3;
    const newShowRate = Math.min(95, inputs.currentShowRate + currentImprovement.showRate);
    const newLeadToBook = Math.min(55, inputs.currentLeadToBook + currentImprovement.leadToBook);
    const newPackageAttach = Math.min(45, inputs.currentPackageAttach + currentImprovement.packageAttach);
    const newRebookRate = Math.min(55, inputs.currentRebookRate + currentImprovement.rebookRate);
    const newBookedLeads = inputs.leadsPerMonth * 12 * (newLeadToBook / 100);
    const newShownVisits = newBookedLeads * (newShowRate / 100);
    const newPackagePatients = newShownVisits * (newPackageAttach / 100);
    const additionalVisitsFromPackages = (newPackagePatients - currentPackagePatients) * packageVisitsBonus;
    const additionalVisitsFromRebook = currentShownVisits * (currentImprovement.rebookRate / 100) * 2;
    const additionalVisitsFromShowRate = (newShownVisits - currentShownVisits) * baseVisitsPerPatient;
    const additionalVisitsFromLeadConversion = ((newBookedLeads - currentBookedLeads) * (newShowRate / 100)) * baseVisitsPerPatient;
    const totalAdditionalVisits = additionalVisitsFromPackages + additionalVisitsFromRebook + additionalVisitsFromShowRate + additionalVisitsFromLeadConversion;
    const additionalRevenue = totalAdditionalVisits * inputs.revenuePerVisit;
    const newAnnualRevenue = currentAnnualRevenue + additionalRevenue;
    const grossMargin = 0.68;
    const additionalGrossProfit = additionalRevenue * grossMargin;
    const noShowWaste = currentNoShows * inputs.revenuePerVisit * baseVisitsPerPatient;
    const slowLeadResponseWaste = (inputs.leadsPerMonth * 12) * (currentImprovement.leadToBook / 100) * (inputs.currentShowRate / 100) * inputs.revenuePerVisit * baseVisitsPerPatient;
    const missedPackageWaste = currentShownVisits * (currentImprovement.packageAttach / 100) * packageVisitsBonus * inputs.revenuePerVisit;
    const missedRebookWaste = currentShownVisits * (currentImprovement.rebookRate / 100) * 2 * inputs.revenuePerVisit;
    const totalCurrentWaste = noShowWaste + slowLeadResponseWaste + missedPackageWaste + missedRebookWaste;
    const valuationImpact = additionalGrossProfit * 3.5;
    
    return {
      current: { annualRevenue: currentAnnualRevenue, annualVisits: currentAnnualVisits, noShows: currentNoShows },
      improved: { annualRevenue: newAnnualRevenue, annualVisits: currentAnnualVisits + totalAdditionalVisits },
      deltas: { revenue: additionalRevenue, grossProfit: additionalGrossProfit, visits: totalAdditionalVisits },
      waste: { noShow: noShowWaste, slowLead: slowLeadResponseWaste, missedPackage: missedPackageWaste, missedRebook: missedRebookWaste, total: totalCurrentWaste },
      valuationImpact
    };
  }, [inputs, scenario, currentImprovement]);

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatNumber = (value) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const validateForm = () => {
    if (!inputs.clinicName.trim()) {
      setValidationError('Please enter your clinic name');
      return false;
    }
    if (!inputs.email.trim()) {
      setValidationError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputs.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    if (!inputs.providers || inputs.providers < 1) {
      setValidationError('Please enter the number of providers');
      return false;
    }
    if (!inputs.visitsPerWeek || inputs.visitsPerWeek < 1) {
      setValidationError('Please enter total visits per week');
      return false;
    }
    if (!inputs.revenuePerVisit || inputs.revenuePerVisit < 1) {
      setValidationError('Please enter average revenue per visit');
      return false;
    }
    if (!inputs.leadsPerMonth || inputs.leadsPerMonth < 1) {
      setValidationError('Please enter new leads per month');
      return false;
    }
    setValidationError('');
    return true;
  };

  const generatePDF = async () => {
    try {
      // Wait for everything to render completely
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture the ENTIRE page including all content
      const canvas = await html2canvas(document.documentElement, {
        scale: 0.8,  // Lower scale for better performance and smaller files
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Convert to JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const sendToGoogleSheets = async (data) => {
    // Replace with your Google Apps Script Web App URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyB9k6Oj2ENVe2wylm02aiTlbTdYtsEqdFp59DdkTsz9jn-rD4C6Jhncnsy56ugfejZ/exec';
    
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      console.log('Data sent to Google Sheets');
    } catch (error) {
      console.error('Error sending to Google Sheets:', error);
    }
  };

  const handleCalculate = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    const resultsData = {
      timestamp: new Date().toISOString(),
      clinicName: inputs.clinicName,
      email: inputs.email,
      clinicType: inputs.clinicType === 'physio' ? 'Physiotherapy' : 'Chiropractic',
      providers: inputs.providers,
      visitsPerWeek: inputs.visitsPerWeek,
      revenuePerVisit: inputs.revenuePerVisit,
      leadsPerMonth: inputs.leadsPerMonth,
      currentShowRate: inputs.currentShowRate,
      currentLeadToBook: inputs.currentLeadToBook,
      currentPackageAttach: inputs.currentPackageAttach,
      currentRebookRate: inputs.currentRebookRate,
      scenario: currentImprovement.label,
      additionalRevenue: formatCurrency(calculations.deltas.revenue),
      additionalGrossProfit: formatCurrency(calculations.deltas.grossProfit),
      valuationImpact: formatCurrency(calculations.valuationImpact),
      totalCurrentWaste: formatCurrency(calculations.waste.total),
      dailyWaste: formatCurrency(calculations.waste.total / 365)
    };

    try {
      // Show results first so we can capture them
      setShowResults(true);
      setShowContact(false);

      // Wait longer for results to fully render, then generate PDF
      setTimeout(async () => {
        try {
          const pdf = await generatePDF();
          if (pdf) {
            pdf.save(`${inputs.clinicName.replace(/[^a-z0-9]/gi, '_')}_Profit_Analysis.pdf`);
          }
        } catch (error) {
          console.error('PDF generation failed:', error);
        }
      }, 3000); // 3 seconds for full page rendering

      // Initialize EmailJS with your public key
      emailjs.init('A9bvjTw3hS4i7qINw');
      
      const emailTemplate = {
        to_name: inputs.clinicName,
        to_email: inputs.email,
        cc_email: 'sjbedecki@gmail.com',
        clinic_name: inputs.clinicName,
        clinic_email: inputs.email,
        clinic_type: resultsData.clinicType,
        providers: inputs.providers,
        visits_per_week: inputs.visitsPerWeek,
        revenue_per_visit: formatCurrency(inputs.revenuePerVisit),
        leads_per_month: inputs.leadsPerMonth,
        show_rate: inputs.currentShowRate,
        lead_to_book: inputs.currentLeadToBook,
        package_attach: inputs.currentPackageAttach,
        rebook_rate: inputs.currentRebookRate,
        scenario: currentImprovement.label,
        additional_revenue: formatCurrency(calculations.deltas.revenue),
        additional_profit: formatCurrency(calculations.deltas.grossProfit),
        valuation_impact: formatCurrency(calculations.valuationImpact),
        total_waste: formatCurrency(calculations.waste.total),
        daily_waste: formatCurrency(calculations.waste.total / 365)
      };

      // Send one email to user with Steve CC'd
      await emailjs.send('service_hudf99a', 'calculator', emailTemplate);

      // Send to Google Sheets
      await sendToGoogleSheets(resultsData);

    } catch (error) {
      console.error('Error submitting form:', error);
      // Still show results even if email/sheets fails
      setShowResults(true);
      setShowContact(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleViewPackages = () => { setShowContact(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); };
  const handleSendResults = () => {
    const subject = encodeURIComponent('Profit Leak Calculator Results - My Clinic');
    const body = encodeURIComponent(`Hello,\n\nI used your Profit Leak Calculator and I'm interested in discussing the results:\n\nCLINIC DETAILS:\n- Clinic Type: ${inputs.clinicType === 'physio' ? 'Physiotherapy' : 'Chiropractic'}\n- Providers: ${inputs.providers}\n- Current Weekly Visits: ${inputs.visitsPerWeek}\n- Revenue Per Visit: ${formatCurrency(inputs.revenuePerVisit)}\n- Monthly Leads: ${inputs.leadsPerMonth}\n\nCURRENT PERFORMANCE:\n- Show Rate: ${inputs.currentShowRate}%\n- Lead-to-Book Rate: ${inputs.currentLeadToBook}%\n- Package Attach Rate: ${inputs.currentPackageAttach}%\n- Rebook Rate: ${inputs.currentRebookRate}%\n\nPROJECTED RESULTS (${currentImprovement.label} Scenario):\n- Additional Annual Revenue: ${formatCurrency(calculations.deltas.revenue)}\n- Additional Gross Profit: ${formatCurrency(calculations.deltas.grossProfit)}\n- Business Valuation Impact: ${formatCurrency(calculations.valuationImpact)}\n- Total Current Waste: ${formatCurrency(calculations.waste.total)}\n\nI'd like to learn more about your services.\n\nBest regards`);
    window.location.href = `mailto:sjbedecki@gmail.com?subject=${subject}&body=${body}`;
  };

  const problems = [];
  if (inputs.currentShowRate < 80) problems.push({ icon: AlertCircle, title: 'High No-Show Rate', description: `Your ${inputs.currentShowRate}% show rate costs ${formatCurrency(calculations.waste.noShow)}/year. That's ${formatNumber(calculations.current.noShows)} empty slots.`, solution: 'AI-Powered Attendance System', details: ['• Predictive no-show detection using ML', '• Intelligent 3-step SMS cadence', '• Frictionless deposit collection + card-on-file', '• One-tap rescheduling with AI-suggested slots', '• Smart waitlist automation fills cancellations in 15min'] });
  if (inputs.currentLeadToBook < 40) problems.push({ icon: AlertCircle, title: 'Slow Lead Response', description: `Only ${inputs.currentLeadToBook}% of leads book. Losing ${formatCurrency(calculations.waste.slowLead)}/year from phone tag.`, solution: 'AI Voice + Instant Response', details: ['• AI phone receptionist answers 24/7, sounds human', '• <60-second missed-call text-back', '• AI chatbot qualifies leads, books into EMR', '• Smart call routing and lead scoring', '• Automated follow-up sequences'] });
  if (inputs.currentPackageAttach < 25) problems.push({ icon: AlertCircle, title: 'Low Treatment Plan Adoption', description: `Only ${inputs.currentPackageAttach}% accept packages. Missing ${formatCurrency(calculations.waste.missedPackage)}/year.`, solution: 'AI Care Plan System', details: ['• Visual plan builder shown DURING booking', '• AI recommends optimal package', '• Dynamic pricing with savings display', '• Progress visualization with timeline', '• Social proof integration'] });
  if (inputs.currentRebookRate < 35) problems.push({ icon: AlertCircle, title: 'Patient Retention Failure', description: `Only ${inputs.currentRebookRate}% rebook. Losing ${formatCurrency(calculations.waste.missedRebook)}/year.`, solution: 'AI Retention Automation', details: ['• "Book-before-you-leave" iPad kiosk', '• AI-powered 30-day recall sequences', '• Predictive drop-off alerts', '• Automated re-engagement campaigns', '• AI voice agent check-in calls'] });
  problems.push({ icon: TrendingUp, title: 'Missing Digital Infrastructure', description: 'Manual processes that don\'t scale. Need systems that work while you sleep.', solution: 'Complete AI Automation Stack', details: ['• AI phone system with EMR integration', '• Automated insurance verification', '• Smart payment processing', '• Review automation engine', '• Real-time analytics dashboard'] });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%)', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px', color: 'white' }}>
          <div style={{ display: 'inline-block', padding: '10px 28px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', marginBottom: '28px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px' }}>PROVEN WITH 10+ PRACTITIONERS • REAL TRANSFORMATIONS</span>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '20px', lineHeight: '1.1' }}>
            Physiotherapy<br/>Profit Leak Calculator
          </h1>
          <p style={{ fontSize: '24px', fontWeight: '500', marginBottom: '12px', opacity: 0.95 }}>
            Discover exactly how much revenue you're losing every day
          </p>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>Complete business transformation: Operations + Marketing + AI Systems • 4-8 week implementation</p>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '50px', marginBottom: '40px', boxShadow: '0 25px 70px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Users size={36} color="#3b82f6" />Your Clinic Information
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>Enter your current numbers (estimates are fine)</p>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #e2e8f0' }}>
            <p style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '600', marginBottom: '12px' }}>We'll analyze your business across 4 critical areas:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#334155' }}>✅ <strong>Operations:</strong> No-shows, lead response, retention</div>
              <div style={{ fontSize: '13px', color: '#334155' }}>✅ <strong>Marketing:</strong> Lead generation, ad campaigns, funnels</div>
              <div style={{ fontSize: '13px', color: '#334155' }}>✅ <strong>AI Automation:</strong> Intelligent systems replacing manual tasks</div>
              <div style={{ fontSize: '13px', color: '#334155' }}>✅ <strong>Growth:</strong> Email sequences, re-engagement, referrals</div>
            </div>
          </div>

          {validationError && (
            <div style={{ padding: '16px', background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={24} color="#dc2626" />
              <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '15px' }}>{validationError}</span>
            </div>
          )}

          <div style={{ marginBottom: '32px', padding: '28px', background: '#f0f9ff', borderRadius: '16px', border: '2px solid #bfdbfe' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#1e40af' }}>📧 Get Your Detailed Results + PDF Report</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '16px' }}>
              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                  Clinic Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={inputs.clinicName} 
                  onChange={(e) => setInputs({...inputs, clinicName: e.target.value})} 
                  placeholder="e.g., Summit Physiotherapy"
                  style={{ width: '100%', padding: '14px', border: inputs.clinicName ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                  required
                />
              </div>
              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input 
                  type="email" 
                  value={inputs.email} 
                  onChange={(e) => setInputs({...inputs, email: e.target.value})} 
                  placeholder="you@yourclinic.com"
                  style={{ width: '100%', padding: '14px', border: inputs.email ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                  required
                />
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.5' }}>
              ✓ Instant PDF download of your results  •  ✓ Personalized email with Steve CC'd for follow-up  •  ✓ Your data is kept confidential  •  ✓ No spam, ever
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div style={{ minWidth: '0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                Number of Providers
              </label>
              <input 
                type="number" 
                value={inputs.providers} 
                onChange={(e) => setInputs({...inputs, providers: parseInt(e.target.value) || 0})} 
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                min="1" 
              />
            </div>

            <div style={{ minWidth: '0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                Total Visits Per Week
              </label>
              <input 
                type="number" 
                value={inputs.visitsPerWeek} 
                onChange={(e) => setInputs({...inputs, visitsPerWeek: parseInt(e.target.value) || 0})} 
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                min="0" 
              />
            </div>

            <div style={{ minWidth: '0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                Avg Revenue Per Visit ($)
              </label>
              <input 
                type="number" 
                value={inputs.revenuePerVisit} 
                onChange={(e) => setInputs({...inputs, revenuePerVisit: parseInt(e.target.value) || 0})} 
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                min="0" 
              />
            </div>

            <div style={{ minWidth: '0' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1e3a8a', fontSize: '15px' }}>
                New Leads Per Month
              </label>
              <input 
                type="number" 
                value={inputs.leadsPerMonth} 
                onChange={(e) => setInputs({...inputs, leadsPerMonth: parseInt(e.target.value) || 0})} 
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', color: '#1e3a8a', fontWeight: '500', boxSizing: 'border-box' }} 
                min="0" 
              />
            </div>
          </div>

          <div style={{ padding: '32px', background: '#f8fafc', borderRadius: '16px', border: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#1e3a8a' }}>Current Performance Metrics</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>Your best estimate is fine—we'll show the improvement potential</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px' }}>
              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                  Show Rate (%)
                </label>
                <input 
                  type="number" 
                  value={inputs.currentShowRate} 
                  onChange={(e) => setInputs({...inputs, currentShowRate: parseInt(e.target.value) || 0})} 
                  style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '16px', color: '#1e3a8a', fontWeight: '600', boxSizing: 'border-box' }} 
                  min="0" 
                  max="100" 
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: '1.4' }}>
                  Industry average: 70-85%
                </span>
              </div>

              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                  Lead-to-Book (%)
                </label>
                <input 
                  type="number" 
                  value={inputs.currentLeadToBook} 
                  onChange={(e) => setInputs({...inputs, currentLeadToBook: parseInt(e.target.value) || 0})} 
                  style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '16px', color: '#1e3a8a', fontWeight: '600', boxSizing: 'border-box' }} 
                  min="0" 
                  max="100" 
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: '1.4' }}>
                  Industry average: 25-40%
                </span>
              </div>

              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                  Package Attach (%)
                </label>
                <input 
                  type="number" 
                  value={inputs.currentPackageAttach} 
                  onChange={(e) => setInputs({...inputs, currentPackageAttach: parseInt(e.target.value) || 0})} 
                  style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '16px', color: '#1e3a8a', fontWeight: '600', boxSizing: 'border-box' }} 
                  min="0" 
                  max="100" 
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: '1.4' }}>
                  Industry average: 10-25%
                </span>
              </div>

              <div style={{ minWidth: '0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                  Rebook Rate (%)
                </label>
                <input 
                  type="number" 
                  value={inputs.currentRebookRate} 
                  onChange={(e) => setInputs({...inputs, currentRebookRate: parseInt(e.target.value) || 0})} 
                  style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '16px', color: '#1e3a8a', fontWeight: '600', boxSizing: 'border-box' }} 
                  min="0" 
                  max="100" 
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: '1.4' }}>
                  Industry average: 20-35%
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#1e3a8a' }}>Select Improvement Scenario</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Based on proven results across 10+ practitioner transformations</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {Object.entries(improvements).map(([key, imp]) => (
                <button key={key} onClick={() => setScenario(key)} style={{ padding: '20px', border: scenario === key ? `3px solid ${imp.color}` : '2px solid #e2e8f0', borderRadius: '14px', background: scenario === key ? `${imp.color}10` : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: imp.color, marginBottom: '10px' }}>{imp.label}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>+{imp.showRate}% Show • +{imp.leadToBook}% Book<br/>+{imp.packageAttach}% Package • +{imp.rebookRate}% Rebook</div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleCalculate} 
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              marginTop: '40px', 
              padding: '20px', 
              background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              fontSize: '22px', 
              fontWeight: '700', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', 
              boxShadow: '0 15px 40px rgba(59,130,246,0.4)',
              transition: 'all 0.3s ease'
            }} 
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = 'translateY(-3px)')} 
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isSubmitting ? '⏳ Calculating & Sending Results...' : 'Calculate My Profit Potential →'}
          </button>
        </div>

        {showResults && (<>
          <div data-testid="results-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ background: '#10b98120', padding: '12px', borderRadius: '12px' }}><DollarSign size={28} color="#10b981" /></div><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Additional Revenue</div></div><div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{formatCurrency(calculations.deltas.revenue)}</div><div style={{ fontSize: '14px', color: '#64748b' }}>Per year with {currentImprovement.label.toLowerCase()} improvements</div></div>
            <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ background: '#3b82f620', padding: '12px', borderRadius: '12px' }}><TrendingUp size={28} color="#3b82f6" /></div><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Additional Gross Profit</div></div><div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>{formatCurrency(calculations.deltas.grossProfit)}</div><div style={{ fontSize: '14px', color: '#64748b' }}>At 68% margin</div></div>
            <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ background: '#8b5cf620', padding: '12px', borderRadius: '12px' }}><Award size={28} color="#8b5cf6" /></div><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Business Value Increase</div></div><div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>{formatCurrency(calculations.valuationImpact)}</div><div style={{ fontSize: '14px', color: '#64748b' }}>At 3.5x EBITDA multiple</div></div>
            <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 40px rgba(220,38,38,0.3)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ background: 'rgba(239,68,68,0.3)', padding: '12px', borderRadius: '12px' }}><AlertCircle size={28} color="#fca5a5" /></div><div style={{ fontSize: '14px', fontWeight: '600', color: '#fecaca' }}>Current Annual Waste</div></div><div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '8px' }}>{formatCurrency(calculations.waste.total)}</div><div style={{ fontSize: '14px', color: '#fecaca' }}>Money bleeding out now</div></div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '48px', marginBottom: '32px', boxShadow: '0 20px 60px rgba(220,38,38,0.15)', border: '2px solid #fecaca' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '24px', marginBottom: '16px', border: '2px solid #fca5a5' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626', letterSpacing: '1.5px' }}>⚠️ THE BRUTAL REALITY</span>
              </div>
              <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '16px' }}>
                What You're Losing Every Day
              </h2>
              <p style={{ fontSize: '18px', color: '#64748b' }}>
                While you're reading this, money is hemorrhaging from your business
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '28px', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }}>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>EVERY DAY</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {formatCurrency(calculations.waste.total / 365)}
                </div>
                <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>Walking out the door</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '28px', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }}>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>EVERY HOUR</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {formatCurrency(calculations.waste.total / 365 / 10)}
                </div>
                <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>During business hours</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '28px', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }}>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>EVERY WEEK</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {formatCurrency(calculations.waste.total / 52)}
                </div>
                <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>Never comes back</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '28px', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }}>
                <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>EVERY MONTH</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {formatCurrency(calculations.waste.total / 12)}
                </div>
                <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>In preventable losses</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', color: '#1e3a8a', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
                Put another way, this waste could fund:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                    {Math.floor(calculations.waste.total / 60000)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>New hires per year</div>
                </div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                    {Math.floor(calculations.waste.total / 150000)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>New treatment rooms</div>
                </div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                    {Math.floor(calculations.waste.total / 25000)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Marketing campaigns</div>
                </div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                    {Math.floor(calculations.waste.total / 80000)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Equipment packages</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '28px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderRadius: '16px', border: '2px solid #fca5a5', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', color: '#dc2626', fontWeight: '700', marginBottom: '12px' }}>
                💡 The Kicker
              </p>
              <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
                Your competitors who've fixed this are capturing YOUR patients
              </p>
              <p style={{ fontSize: '15px', color: '#7f1d1d', lineHeight: '1.6' }}>
                Every day you wait, another clinic gets further ahead with automated systems that convert better and cost less
              </p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '40px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', color: '#1e3a8a', textAlign: 'center' }}>Your Complete Business Transformation Plan</h2>
            <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', marginBottom: '32px' }}>Operations systems + marketing infrastructure + growth automation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {problems.map((prob, i) => (
                <div key={i} style={{ background: 'linear-gradient(to right, #fef3c7, #fef9c3)', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '28px', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <prob.icon size={36} color="#f59e0b" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#78350f', marginBottom: '12px' }}>{prob.title}</h3>
                      <p style={{ fontSize: '16px', color: '#92400e', marginBottom: '20px', lineHeight: '1.6' }}>{prob.description}</p>
                      <div style={{ padding: '20px', background: 'white', borderRadius: '10px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} />{prob.solution}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{prob.details.map((d, j) => <div key={j} style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>{d}</div>)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '40px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', color: '#1e3a8a', textAlign: 'center' }}>Your Clinic: Before vs After</h2>
            <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', marginBottom: '40px' }}>{currentImprovement.label} scenario projections</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Revenue Comparison */}
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Annual Revenue</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Current:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: '#94a3b8', height: '100%', width: `${Math.max(20, (calculations.current.annualRevenue / calculations.improved.annualRevenue) * 100)}%`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px', minWidth: '140px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(calculations.current.annualRevenue)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Improved:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: currentImprovement.color, height: '100%', width: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(calculations.improved.annualRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gross Profit Comparison */}
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Gross Profit</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Current:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: '#94a3b8', height: '100%', width: `${Math.max(20, ((calculations.current.annualRevenue * 0.68) / (calculations.improved.annualRevenue * 0.68)) * 100)}%`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px', minWidth: '140px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(calculations.current.annualRevenue * 0.68)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Improved:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: currentImprovement.color, height: '100%', width: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(calculations.improved.annualRevenue * 0.68)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annual Visits Comparison */}
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Annual Visits</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Current:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: '#94a3b8', height: '100%', width: `${Math.max(20, (calculations.current.annualVisits / calculations.improved.annualVisits) * 100)}%`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px', minWidth: '120px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatNumber(calculations.current.annualVisits)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px', fontSize: '14px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Improved:</div>
                  <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '48px', position: 'relative', overflow: 'visible' }}>
                    <div style={{ background: currentImprovement.color, height: '100%', width: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatNumber(calculations.improved.annualVisits)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', borderRadius: '20px', padding: '48px', marginBottom: '32px', boxShadow: '0 20px 60px rgba(59,130,246,0.4)', textAlign: 'center', color: 'white', border: '1px solid rgba(147,197,253,0.3)' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '16px' }}>Ready to Capture This Revenue?</h2>
            <p style={{ fontSize: '20px', marginBottom: '12px', opacity: 0.95 }}>Every day you wait costs you {formatCurrency(calculations.waste.total / 365)}</p>
            <p style={{ fontSize: '16px', marginBottom: '36px', opacity: 0.85 }}>Let's implement these AI systems and start recovering lost revenue within 30 days</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <button onClick={handleSendResults} style={{ padding: '20px 56px', background: 'white', color: '#1e40af', border: 'none', borderRadius: '12px', fontSize: '19px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}><Mail size={24} />Email My Results & Book Consultation</button>
              <button onClick={handleViewPackages} style={{ padding: '18px 48px', background: 'transparent', color: 'white', border: '2px solid white', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1e40af'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'white'; }}>View Service Packages<ArrowRight size={24} /></button>
            </div>
          </div>
        </>)}

        {showContact && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '16px', color: '#1e3a8a', textAlign: 'center' }}>Choose Your Transformation Path</h2>
            <p style={{ fontSize: '18px', color: '#64748b', textAlign: 'center', marginBottom: '48px' }}>Two proven ways to capture the revenue you're missing</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
              <div style={{ border: '2px solid #cbd5e1', borderRadius: '20px', padding: '40px', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}><div style={{ fontSize: '26px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>SETUP & TRAIN</div><div style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>You manage it, we build it</div></div>
                <div style={{ marginBottom: '32px' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '16px' }}>WHAT'S INCLUDED:</div><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{['Complete AI automation implementation', 'Custom workflow configuration', 'Full documentation & playbooks', 'In-person staff training (4 hours)', 'Template library', '30 days post-launch support'].map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}><CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} /><span style={{ fontSize: '15px', color: '#334155' }}>{item}</span></div>)}</div></div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', marginBottom: '24px', border: '1px solid #cbd5e1' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>BEST FOR:</div><div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>Clinics with strong operations teams who want systems built but prefer self-management</div></div>
                <div style={{ padding: '20px', background: '#ecfdf5', borderRadius: '12px', marginBottom: '24px', border: '1px solid #6ee7b7' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>EXPECTED OUTCOME:</div><div style={{ fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>{formatCurrency(calculations.deltas.grossProfit * 0.7)} - {formatCurrency(calculations.deltas.grossProfit)} additional gross profit in year 1</div></div>
                <button onClick={handleSendResults} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>Inquire About Setup & Train</button>
              </div>
              <div style={{ border: '3px solid #8b5cf6', borderRadius: '20px', padding: '40px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-16px', right: '32px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>⭐ RECOMMENDED</div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}><div style={{ fontSize: '26px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>FULL TRANSFORMATION</div><div style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>Ongoing optimization & growth</div></div>
                <div style={{ marginBottom: '32px' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '16px' }}>EVERYTHING IN SETUP & TRAIN, PLUS:</div><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{['Monthly AI system management', 'Biweekly performance reviews', 'Continuous A/B testing', 'New automation implementation', 'Staff coaching', 'Priority support (24hr)', 'Quarterly strategy sessions', 'Unlimited adjustments'].map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}><CheckCircle size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} /><span style={{ fontSize: '15px', color: '#1e293b', fontWeight: i < 3 ? '600' : '400' }}>{item}</span></div>)}</div></div>
                <div style={{ padding: '20px', background: 'white', borderRadius: '12px', marginBottom: '24px', border: '2px solid #8b5cf6' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>BEST FOR:</div><div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>Owners who want to focus on patient care while we maximize ROI long-term</div></div>
                <div style={{ padding: '20px', background: '#f5f3ff', borderRadius: '12px', marginBottom: '24px', border: '2px solid #c4b5fd' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#5b21b6', marginBottom: '8px' }}>EXPECTED OUTCOME:</div><div style={{ fontSize: '14px', color: '#6d28d9', lineHeight: '1.6' }}>{formatCurrency(calculations.deltas.grossProfit)} - {formatCurrency(calculations.deltas.grossProfit * 1.3)} additional gross profit in year 1, compounding in years 2-3</div></div>
                <button onClick={handleSendResults} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(139,92,246,0.4)' }}>Inquire About Full Transformation</button>
              </div>
            </div>
            <div style={{ marginTop: '48px', padding: '32px', background: '#ecfdf5', borderRadius: '16px', textAlign: 'center', border: '1px solid #6ee7b7' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#065f46', marginBottom: '16px' }}>Risk-Free 14-Day Pilot</h3>
              <p style={{ fontSize: '16px', color: '#047857', marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px' }}>Start with a 14-day pilot. If we don't move at least one key metric, you don't pay.</p>
              <button onClick={handleSendResults} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>Start With a 14-Day Pilot</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '48px', paddingBottom: '24px' }}>
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px', color: '#cbd5e1' }}>Results based on 10+ health practitioner transformations (2023-2025) • Individual results vary based on implementation, market conditions, and execution consistency</p>
            <p style={{ fontSize: '14px', marginBottom: '4px', color: '#cbd5e1', fontWeight: '600' }}>Powered by:</p>
            <p style={{ fontSize: '13px', marginBottom: '16px', color: '#cbd5e1' }}>✓ Operations automation & AI-powered systems • ✓ Data-driven marketing & advertising optimization<br/>✓ Intelligent conversion funnels & email sequences • ✓ Proven growth infrastructure & continuous testing</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
              Ready to discuss your transformation?<br/>
              <strong>Steve Bedecki</strong><br/>
              📧 <a href="mailto:sjbedecki@gmail.com" style={{ color: '#60a5fa', textDecoration: 'none', borderBottom: '1px solid #60a5fa' }}>sjbedecki@gmail.com</a> • 📱 <a href="tel:6133401321" style={{ color: '#60a5fa', textDecoration: 'none', borderBottom: '1px solid #60a5fa' }}>613-340-1321</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicProfitCalculator;