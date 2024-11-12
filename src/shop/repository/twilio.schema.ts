/**
 * Twilio WhatsApp message payload
 * When user sends a message
 * When message comes in
 * @typedef {Object} WhatsAppMessage
 * @property {string} SmsMessageSid - The unique identifier for the SMS message.
 * @property {string} NumMedia - The number of media files associated with the message.
 * @property {string} ProfileName - The profile name of the sender.
 * @property {string} MessageType - The type of the message (e.g., text).
 * @property {string} SmsSid - The unique identifier for the SMS.
 * @property {string} WaId - The WhatsApp ID of the sender.
 * @property {string} SmsStatus - The status of the SMS (e.g., received).
 * @property {string} Body - The body content of the message.
 * @property {string} To - The recipient's phone number in WhatsApp format.
 * @property {string} NumSegments - The number of segments the message is divided into.
 * @property {string} ReferralNumMedia - The number of media files in the referral message.
 * @property {string} MessageSid - The unique identifier for the message.
 * @property {string} AccountSid - The unique identifier for the Twilio account.
 * @property {string} From - The sender's phone number in WhatsApp format.
 * @property {string} ApiVersion - The version of the Twilio API used.
 */

export interface WhatsAppMessage {
    SmsMessageSid: string;
    NumMedia: string;
    ProfileName: string;
    MessageType: string;
    SmsSid: string;
    WaId: string;
    SmsStatus: string;
    Body: string;
    To: string;
    NumSegments: string;
    ReferralNumMedia: string;
    MessageSid: string;
    AccountSid: string;
    From: string;
    ApiVersion: string;
}

/**
 * Webhook callback payload for SMS Message
 * 
 * @typedef {Object} TwilioSmsMessage
 * @property {string} SmsMessageSid - The unique identifier for the SMS message.
 * @property {string} NumMedia - The number of media files associated with the message.
 * @property {string} ProfileName - The profile name of the sender.
 * @property {string} MessageType - The type of the message (e.g., text).
 * @property {string} SmsSid - The unique identifier for the SMS.
 * @property {string} WaId - The WhatsApp ID of the sender.
 * @property {string} SmsStatus - The status of the SMS (e.g., received).
 * @property {string} Body - The body content of the message.
 * @property {string} To - The recipient's phone number in WhatsApp format.
 * @property {string} NumSegments - The number of segments the message is divided into.
 * @property {string} ReferralNumMedia - The number of media files in the referral message.
 * @property {string} MessageSid - The unique identifier for the message.
 * @property {string} AccountSid - The unique identifier for the Twilio account.
 * @property {string} From - The sender's phone number in WhatsApp format.
 * @property {string} ApiVersion - The version of the Twilio API used.
 * @property {string} ToCountry - The country of the recipient.
 * @property {string} ToState - The state of the recipient.
 * @property {string} ToCity - The city of the recipient.
 * @property {string} FromZip - The zip code of the sender.
 * @property {string} FromState - The state of the sender.
 * @property {string} FromCity - The city of the sender.
 * @property {string} FromCountry - The country of the sender.
 * @property {string} ToZip - The zip code of the recipient.
 */

export interface TwilioSmsMessage {
    SmsMessageSid: string;
    NumMedia: string;
    ProfileName: string;
    MessageType: string;
    SmsSid: string;
    WaId: string;
    SmsStatus: string;
    Body: string;
    To: string;
    NumSegments: string;
    ReferralNumMedia: string;
    MessageSid: string;
    AccountSid: string;
    From: string;
    ApiVersion: string;
    ToCountry: string;
    ToState: string;
    ToCity: string;
    FromZip: string;
    FromState: string;
    FromCity: string;
    FromCountry: string;
    ToZip: string;
}

/**
 * Twilio WhatsApp status callback payload
 * 
 * @typedef {Object} WhatsAppStatusCallback
 * @property {string} ChannelPrefix - The channel prefix (e.g., "whatsapp").
 * @property {string} ApiVersion - The version of the Twilio API used.
 * @property {string} MessageStatus - The status of the message (e.g., "read").
 * @property {string} SmsSid - The unique identifier for the SMS.
 * @property {string} SmsStatus - The status of the SMS (e.g., "read").
 * @property {string} To - The recipient's phone number in WhatsApp format.
 * @property {string} From - The sender's phone number in WhatsApp format.
 * @property {string} MessageSid - The unique identifier for the message.
 * @property {string} AccountSid - The unique identifier for the Twilio account.
 * @property {string} ChannelToAddress - The address of the channel recipient.
 */

export interface WhatsAppStatusCallback {
    ChannelPrefix: string;
    ApiVersion: string;
    MessageStatus: string;
    SmsSid: string;
    SmsStatus: string;
    To: string;
    From: string;
    MessageSid: string;
    AccountSid: string;
    ChannelToAddress: string;
}

/**
 * @typedef {Object} WhatsAppUser
 * @property {string} whatsappUserId
 * @property {string} ProfileName - received from message.From
 */

export interface WhatsAppUser {
    whatsappUserId: string;
    ProfileName: string;
}
