// Email notification service
// This service provides helper functions to send various types of email notifications

interface EmailData {
  name?: string;
  listingTitle?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  paymentMethod?: string;
  pickupLocation?: string;
  ownerContact?: string;
  changeDetails?: string;
  returnLocation?: string;
  returnTime?: string;
  senderName?: string;
  messagePreview?: string;
}

type EmailType = 
  | 'welcome' 
  | 'booking_confirmation' 
  | 'checkin_reminder' 
  | 'booking_change' 
  | 'return_reminder' 
  | 'message_notification';

/**
 * Send an email notification
 * @param type - Type of email to send
 * @param to - Recipient email address
 * @param data - Email template data
 * @returns Promise with email response
 */
export async function sendEmail(
  type: EmailType,
  to: string,
  data: EmailData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, to, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Email sending failed:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  return sendEmail('welcome', userEmail, { name: userName });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  userEmail: string,
  bookingData: {
    name: string;
    listingTitle: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    paymentMethod: string;
  }
) {
  return sendEmail('booking_confirmation', userEmail, bookingData);
}

/**
 * Send check-in reminder email
 */
export async function sendCheckinReminder(
  userEmail: string,
  reminderData: {
    name: string;
    listingTitle: string;
    startDate: string;
    pickupLocation: string;
    ownerContact: string;
  }
) {
  return sendEmail('checkin_reminder', userEmail, reminderData);
}

/**
 * Send booking change notification
 */
export async function sendBookingChangeNotification(
  userEmail: string,
  changeData: {
    name: string;
    listingTitle: string;
    changeDetails: string;
  }
) {
  return sendEmail('booking_change', userEmail, changeData);
}

/**
 * Send return reminder email
 */
export async function sendReturnReminder(
  userEmail: string,
  returnData: {
    name: string;
    listingTitle: string;
    endDate: string;
    returnLocation: string;
    returnTime: string;
  }
) {
  return sendEmail('return_reminder', userEmail, returnData);
}

/**
 * Send message notification email
 */
export async function sendMessageNotification(
  userEmail: string,
  messageData: {
    senderName: string;
    listingTitle: string;
    messagePreview: string;
  }
) {
  return sendEmail('message_notification', userEmail, messageData);
}
