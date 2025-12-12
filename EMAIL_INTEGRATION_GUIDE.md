# Email Integration Guide

## Overview
This guide explains how to integrate email notifications in your GoodsLister marketplace using Resend.

## Setup Complete ✅

### 1. Email API Endpoint
- **File**: `api/send-email.ts`
- **Status**: ✅ Created and committed
- **Features**: 
  - Welcome emails
  - Booking confirmations
  - Check-in reminders
  - Booking change notifications
  - Return reminders
  - Message notifications

### 2. Email Service Utility
- **File**: `services/emailService.ts`
- **Status**: ✅ Created and committed
- **Exports**: Helper functions for all email types

## Next Steps

### Step 1: Add RESEND_API_KEY to Vercel

1. Go to Resend dashboard: https://resend.com/api-keys
2. Copy one of your API keys (starts with `re_`)
3. Go to Vercel: https://vercel.com/luciano-reverberis-projects/goodslister-marketplace-2025/settings/environment-variables
4. Add environment variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - **Environments**: Select all (Production, Preview, Development)
5. Redeploy the application

### Step 2: Integrate Email Triggers

#### A. Booking Confirmation Email

**File to modify**: `App.tsx` (or wherever `createBooking` function is)

**Add this import**:
```typescript
import { sendBookingConfirmation } from './services/emailService';
```

**Add email trigger after successful booking**:
```typescript
const createBooking = async (
  listingId: string,
  startDate: Date,
  endDate: Date,
  totalPrice: number,
  paymentMethod: 'platform' | 'direct',
  protectionType: 'waiver' | 'insurance',
  protectionFee: number
): Promise<Booking> => {
  // ... existing booking creation code ...
  
  const newBooking = {
    id: bookingId,
    listing,
    startDate,
    endDate,
    totalPrice,
    paymentMethod,
    protectionType,
    protectionFee,
    status: 'confirmed'
  };
  
  // ADD THIS: Send booking confirmation email
  if (currentUser?.email) {
    await sendBookingConfirmation(currentUser.email, {
      name: currentUser.name,
      listingTitle: listing.title,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      totalPrice,
      paymentMethod
    });
  }
  
  return newBooking;
};
```

#### B. Welcome Email (User Registration)

**File to modify**: `components/LoginModal.tsx` (or registration handler)

**Add this import**:
```typescript
import { sendWelcomeEmail } from '../services/emailService';
```

**Add after successful registration**:
```typescript
const handleRegister = async () => {
  // ... existing registration code ...
  
  // ADD THIS: Send welcome email
  if (newUser.email) {
    await sendWelcomeEmail(newUser.email, newUser.name);
  }
};
```

#### C. Check-in Reminder (Scheduled)

This should be triggered 24 hours before rental start. You can:
- Use Vercel Cron Jobs
- Use a third-party scheduler
- Add it to your backend job queue

**Example**:
```typescript
import { sendCheckinReminder } from './services/emailService';

// Run this daily to check upcoming bookings
const sendUpcomingReminderss = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const upcomingBookings = bookings.filter(b => 
    isSameDay(new Date(b.startDate), tomorrow)
  );
  
  for (const booking of upcomingBookings) {
    await sendCheckinReminder(booking.user.email, {
      name: booking.user.name,
      listingTitle: booking.listing.title,
      startDate: new Date(booking.startDate).toLocaleDateString(),
      pickupLocation: booking.listing.location.address,
      ownerContact: booking.listing.owner.phone
    });
  }
};
```

#### D. Return Reminder

Similar to check-in, send 1 day before return:

```typescript
import { sendReturnReminder } from './services/emailService';

// Run daily
const sendReturnReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const endingBookings = bookings.filter(b => 
    isSameDay(new Date(b.endDate), tomorrow)
  );
  
  for (const booking of endingBookings) {
    await sendReturnReminder(booking.user.email, {
      name: booking.user.name,
      listingTitle: booking.listing.title,
      endDate: new Date(booking.endDate).toLocaleDateString(),
      returnLocation: booking.listing.location.address,
      returnTime: '6:00 PM' // customize as needed
    });
  }
};
```

#### E. Booking Change Notification

**When owner modifies a booking**:
```typescript
import { sendBookingChangeNotification } from './services/emailService';

const handleBookingUpdate = async (bookingId: string, changes: any) => {
  // ... update booking ...
  
  await sendBookingChangeNotification(booking.user.email, {
    name: booking.user.name,
    listingTitle: booking.listing.title,
    changeDetails: `Dates changed to ${newStartDate} - ${newEndDate}`
  });
};
```

#### F. Message Notifications

**In your chat system**:
```typescript
import { sendMessageNotification } from './services/emailService';

const sendMessage = async (message: Message) => {
  // ... save message ...
  
  // Notify recipient
  if (recipient.email) {
    await sendMessageNotification(recipient.email, {
      senderName: sender.name,
      listingTitle: listing.title,
      messagePreview: message.text.substring(0, 100)
    });
  }
};
```

## Testing

### Local Testing

1. Start development server: `npm run dev`
2. Use your own email for testing
3. Check email delivery in Resend dashboard: https://resend.com/emails

### Production Testing

After deploying:
1. Create a test booking
2. Check if email arrives
3. Verify email content and formatting

## Troubleshooting

### Email not sending
- Check Vercel logs for errors
- Verify RESEND_API_KEY is set correctly
- Confirm email address is verified in Resend (free tier requirement)

### Email goes to spam
- Add your domain to Resend
- Configure SPF, DKIM records
- Use a verified sender domain (not `onboarding@resend.dev`)

## Resend Limitations (Free Tier)

- 100 emails/day
- Only send to verified email addresses
- Sender must be `onboarding@resend.dev`
- To remove limits: Verify your domain in Resend dashboard

## Next Improvements

- [ ] Add HTML email templates (using React Email)
- [ ] Schedule automated reminders with Vercel Cron
- [ ] Add email preferences for users
- [ ] Track email open rates
- [ ] Add unsubscribe functionality

## Support

Resend Documentation: https://resend.com/docs
Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
