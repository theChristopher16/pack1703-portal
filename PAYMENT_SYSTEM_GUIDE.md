# Payment System Guide

Complete guide for setting up and using the Pack 1703 Portal payment system powered by Square.

## Table of Contents

1. [Overview](#overview)
2. [Square Setup](#square-setup)
3. [Configuration](#configuration)
4. [Creating Paid Events](#creating-paid-events)
5. [Admin Payment Management](#admin-payment-management)
6. [User Payment Flow](#user-payment-flow)
7. [Manual Payment Recording](#manual-payment-recording)
8. [Payment Reports](#payment-reports)
9. [Troubleshooting](#troubleshooting)
10. [Security](#security)

---

## Overview

The payment system allows you to:

- **Charge for Events**: Require payment for event RSVPs
- **Accept Multiple Payment Methods**: Credit/debit cards via Square, plus manual recording for cash/checks
- **Track Payment Status**: Real-time tracking of who has and hasn't paid
- **Generate Reports**: Export payment data for accounting and reconciliation
- **Secure Processing**: PCI-compliant payment processing through Square

### Architecture

```
User RSVP → Payment Required → Square Payment Form → Cloud Function Processing → Payment Record → RSVP Confirmed
                                    ↓
                              Manual Payment Option (Admin)
```

---

## Square Setup

### 1. Create Square Account

1. Go to [https://squareup.com/signup](https://squareup.com/signup)
2. Sign up for a free Square account
3. Complete business verification

### 2. Get API Credentials

1. Log in to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or select existing one
3. Navigate to **Credentials** tab

#### For Development (Sandbox)
- Copy **Sandbox Application ID**
- Copy **Sandbox Access Token**
- Copy **Sandbox Location ID**

#### For Production
- Copy **Production Application ID**
- Copy **Production Access Token**
- Copy **Production Location ID**

### 3. Configure Web Payments SDK

1. In Square Dashboard, go to **Web Payments SDK**
2. Add your domain(s):
   - Development: `http://localhost:3000`
   - Production: `https://sfpack1703.web.app`
3. Save configuration

---

## Configuration

### Environment Variables

#### Client-Side (`.env`)

```bash
# Square Configuration (Frontend)
REACT_APP_SQUARE_APPLICATION_ID=your_square_application_id
REACT_APP_SQUARE_LOCATION_ID=your_square_location_id
REACT_APP_SQUARE_ENVIRONMENT=sandbox  # or 'production'
```

#### Server-Side (Firebase Functions)

Set these using Firebase CLI:

```bash
# Square Configuration (Backend)
firebase functions:config:set \
  square.application_id="your_square_application_id" \
  square.access_token="your_square_access_token" \
  square.location_id="your_square_location_id" \
  square.environment="sandbox"

# Deploy functions to apply changes
firebase deploy --only functions
```

#### For Production

```bash
# Update environment to production
firebase functions:config:set square.environment="production"

# Use production credentials
firebase functions:config:set \
  square.application_id="prod_app_id" \
  square.access_token="prod_access_token" \
  square.location_id="prod_location_id"
```

### Verify Configuration

```bash
# View current configuration
firebase functions:config:get
```

---

## Creating Paid Events

### Through Web Interface

1. **Navigate to Events Page** (Admin only)
2. **Click "Create Event"**
3. **Fill in Event Details**:
   - Title, Date, Location, Description, etc.

4. **Enable Payment**:
   - Check ✅ **"Require Payment"**
   - Enter **Amount** (in dollars, e.g., `25.00`)
   - Select **Currency** (default: USD)
   - Add **Payment Description** (e.g., "Cover fee for USS Stewart tour")

5. **Save Event**

### Example Payment Configuration

```
Event: USS Stewart Tour
Payment Required: ✅ Yes
Amount: $25.00
Currency: USD
Description: Cover fee for USS Stewart tour including guide and materials
```

### Payment Settings Fields

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| **Payment Required** | Enable/disable payment for this event | Yes | ✅ Checked |
| **Payment Amount** | Amount in dollars | Yes | 25.00 |
| **Payment Currency** | Currency code | Yes | USD |
| **Payment Description** | What the payment covers | Optional | USS Stewart tour fee |

---

## Admin Payment Management

### Accessing Payment Dashboard

1. **Navigate to Events Page**
2. **Find event with payment enabled**
3. **Click "Payments" button** (green $ icon)

### Payment Dashboard Features

#### Summary Statistics

- **Total RSVPs**: Number of families registered
- **Paid Count**: Number who have paid
- **Unpaid Count**: Number pending payment
- **Total Expected**: Total revenue expected
- **Total Received**: Total revenue collected
- **Pending Amount**: Outstanding payments

#### Payment Status Filters

- **All**: Show all RSVPs
- **Paid**: Show only paid RSVPs
- **Unpaid**: Show only pending payments

#### Actions Available

- **Record Manual Payment**: Add cash/check payments
- **Export CSV**: Download payment report
- **View Payment Details**: See payment method, date, notes

### Recording Manual Payments

For families who pay with cash or check:

1. **Open Payment Dashboard**
2. **Find family with "Payment Pending"**
3. **Click "Record Payment"**
4. **Select Payment Method**:
   - Cash
   - Check
   - Other
5. **Add Notes** (optional):
   - Check number
   - Receipt information
   - Payment date
6. **Click "Record Payment"**

The RSVP status will immediately update to "Paid".

---

## User Payment Flow

### For Users RSVPing to Paid Events

#### 1. Submit RSVP

- Fill out RSVP form as normal
- Submit family information

#### 2. Payment Screen

After submitting RSVP:

- See payment required notice
- Amount clearly displayed
- Square payment form loads

#### 3. Enter Payment Information

- **Card Number**: Enter credit/debit card
- **Expiration**: MM/YY
- **CVV**: Security code
- **Postal Code**: Billing zip code

#### 4. Submit Payment

- Click "Pay Now"
- Processing indicator shows
- Confirmation on success

#### 5. Confirmation

- RSVP confirmed
- Payment receipt sent
- Event added to calendar

### Payment Methods Accepted

| Method | Description | Processed By |
|--------|-------------|--------------|
| **Credit Card** | Visa, Mastercard, Amex, Discover | Square |
| **Debit Card** | Bank debit cards | Square |
| **Cash** | Physical cash (admin recorded) | Manual |
| **Check** | Paper check (admin recorded) | Manual |

---

## Payment Reports

### Exporting Payment Data

1. **Open Payment Dashboard**
2. **Click "Export CSV"**
3. **File downloads** with name: `[Event_Name]_payments_[Date].csv`

### Report Contents

#### Summary Section
- Total RSVPs
- Paid count
- Unpaid count
- Financial totals

#### Detailed Records
- Family Name
- Email
- Attendee Count
- Payment Status
- Payment Amount
- Payment Method
- Paid Date
- Notes

### Using Reports

#### Reconciliation

```csv
Family Name,Status,Amount,Method,Date
Smith Family,completed,$25.00,square,2025-01-15
Jones Family,completed,$25.00,cash,2025-01-16
Johnson Family,pending,$25.00,N/A,N/A
```

#### Accounting

Import CSV into:
- Excel/Google Sheets for analysis
- QuickBooks for accounting
- Custom financial tools

---

## Troubleshooting

### Common Issues

#### "Square SDK failed to load"

**Problem**: Square payment form doesn't appear

**Solutions**:
1. Check internet connection
2. Verify Square Application ID is correct
3. Check browser console for errors
4. Ensure domain is registered in Square dashboard
5. Try different browser

#### "Payment creation failed"

**Problem**: Error when initializing payment

**Solutions**:
1. Verify environment variables are set
2. Check Cloud Functions logs:
   ```bash
   firebase functions:log
   ```
3. Confirm Square credentials are valid
4. Check if Square account is active

#### "Payment processing failed"

**Problem**: Card is declined or payment fails

**Solutions**:
1. Ask user to verify card details
2. Try different payment method
3. Check Square dashboard for declined reason
4. Ensure sufficient funds

#### Manual payment not recording

**Problem**: Admin can't record manual payment

**Solutions**:
1. Verify admin permissions
2. Check Firestore security rules
3. Ensure RSVP exists
4. Check browser console for errors

### Logs and Debugging

#### View Cloud Function Logs

```bash
# Real-time logs
firebase functions:log --only createRSVPPayment,completeRSVPPayment

# Last 100 lines
firebase functions:log --lines 100
```

#### Check Payment Records

In Firestore Console:
1. Navigate to `payments` collection
2. Find payment by ID
3. Check `status` field
4. Review error messages

---

## Security

### PCI Compliance

- **Square Handles Sensitive Data**: Credit card data never touches your servers
- **Tokenization**: Card details converted to secure tokens
- **Encrypted Transmission**: All data sent over HTTPS
- **No Storage**: Card details not stored in your database

### Firestore Security Rules

#### User Permissions

```javascript
// Users can read their own payments
allow read: if isAuthenticated() && 
  resource.data.userId == request.auth.uid;

// Admins can manage all payments
allow read, update: if isAdmin();

// Only Cloud Functions can create payments
allow create: if false;
```

### Best Practices

1. **Use Production Credentials in Production**
   - Never use sandbox credentials in production
   - Keep access tokens secret

2. **Regular Audits**
   - Review payment records monthly
   - Reconcile with Square dashboard
   - Check for discrepancies

3. **Access Control**
   - Limit admin access to trusted users
   - Use role-based permissions
   - Audit admin actions

4. **Backup Payment Data**
   - Export payment reports regularly
   - Store securely offline
   - Maintain for tax/accounting purposes

---

## Advanced Features

### Refunds

To issue a refund:

1. **Access Square Dashboard**
2. **Navigate to Transactions**
3. **Find Payment**
4. **Click "Refund"**
5. **Update Firestore Record**:
   ```javascript
   {
     status: 'refunded',
     refundedAt: Timestamp.now(),
     refundReason: 'Event cancelled'
   }
   ```

### Webhooks (Future)

Square webhook handler is partially implemented for:
- Payment confirmations
- Refund notifications
- Dispute alerts

To activate:
1. Configure webhook URL in Square dashboard
2. Implement signature verification
3. Handle webhook events

### Custom Payment Amounts

For variable pricing:

```javascript
// In event form
paymentAmount: familySize * basePrice
// e.g., 4 people * $25 = $100
```

### Payment Reminders

Send reminders to families with pending payments:

1. Query RSVPs with `paymentStatus: 'pending'`
2. Send email via email service
3. Include payment deadline
4. Provide support contact

---

## Support

### Getting Help

1. **Check This Guide**: Start here for common questions
2. **Firebase Console**: View logs and errors
3. **Square Dashboard**: Check transaction status
4. **Contact Support**: 
   - Technical issues: [Your support email]
   - Square issues: [Square Support](https://squareup.com/help)

### Useful Resources

- [Square Documentation](https://developer.squareup.com/docs)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## Quick Reference

### Square Dashboard URLs

- **Sandbox**: https://developer.squareup.com/apps
- **Production**: https://squareup.com/dashboard

### Firebase Commands

```bash
# Set Square config
firebase functions:config:set square.access_token="token"

# View config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log
```

### Key Files

```
src/
  components/
    Admin/PaymentDashboard.tsx    # Admin payment interface
  services/
    paymentService.ts              # Payment operations
functions/
  src/
    index.ts                       # Payment Cloud Functions
firestore.rules                    # Security rules
env.example                        # Environment template
```

---

## Changelog

### Version 1.0 (January 2025)

- Initial payment system implementation
- Square integration
- Admin payment dashboard
- Manual payment recording
- Payment reports and export
- Security rules for payments collection

---

*Last Updated: January 2025*  
*Version: 1.0*

