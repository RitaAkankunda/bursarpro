# Feature Images

Add your feature screenshots here. The Landing page expects these image files:

## Required Images

1. **bank-level-security.png** (or .jpg, .webp)
   - Feature: Bank-Level Security
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: Screenshot showing security/encryption features, lock icon, dashboard with secure interface

2. **instant-sms-alerts.png**
   - Feature: Instant SMS Alerts
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: Screenshot of SMS notification being sent, parent receiving alert, SMS confirmation screen

3. **pro-receipts.png**
   - Feature: Pro Receipts
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: PDF receipt preview, printing interface, email receipt options

4. **all-payment-methods.png**
   - Feature: All Payment Methods
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: Payment methods dashboard, multiple payment options (Mobile Money, Bank, Cash, Cheques)

5. **student-records.png**
   - Feature: Student Records
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: Student database view, payment history table, student profile with balance info

6. **real-time-analytics.png**
   - Feature: Real-Time Analytics
   - Recommended dimensions: 400×300px or 800×600px
   - Suggested content: Analytics dashboard, charts/graphs, collection summaries, trending data

## Implementation Notes

- The FeatureCard component now accepts both `icon` (fallback) and `image` props
- If an image is not found, the icon will be displayed as fallback
- Images are displayed in a 400px high container with object-cover fit
- Images scale up on hover for interactive effect
- Supported formats: PNG, JPG, JPEG, WebP

## Next Steps

1. Run your application: `npm run dev`
2. Visit: `http://localhost:5173`
3. Replace placeholder paths with real feature screenshots
4. Test responsiveness on mobile and desktop
