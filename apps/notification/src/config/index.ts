// notification-service/src/config/index.ts
export const notificationConfig = {
    email: {
        provider: process.env.EMAIL_PROVIDER as "SMTP" | "SENDGRID" | "SES",
        costPerEmail: parseFloat(process.env.COST_PER_EMAIL || "0.05"),
        config: {
            // SMTP
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // SendGrid
            apiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.FROM_EMAIL,
            fromName: process.env.FROM_NAME,
        },
    },
    sms: {
        provider: process.env.SMS_PROVIDER as "TWILIO" | "MSG91" | "TEXTLOCAL",
        costPerSegment: parseFloat(process.env.SMS_COST_PER_SEGMENT || "0.05"),
        config: {
            // Twilio
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER,
            statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
            baseUrl: process.env.API_BASE_URL || "https://api.yourservice.com",
        },
    },
    whatsapp: {
        // provider: process.env.WHATSAPP_PROVIDER as
        //     | "TWILIO"
        //     | "WHATSAPP_BUSINESS_API",

        provider: process.env.WHATSAPP_PROVIDER || "whatsapp-business-api",
        defaultLanguage: process.env.WHATSAPP_DEFAULT_LANGUAGE || "en",
        config: {
            // accountSid: process.env.TWILIO_ACCOUNT_SID,
            // authToken: process.env.TWILIO_AUTH_TOKEN,
            // fromNumber: process.env.TWILIO_WHATSAPP_FROM,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
            webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
            apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",
        },
        costs: {
            text: parseFloat(process.env.WHATSAPP_TEXT_COST || "0.02"),
            template: parseFloat(process.env.WHATSAPP_TEMPLATE_COST || "0.03"),
            media: parseFloat(process.env.WHATSAPP_MEDIA_COST || "0.04"),
            document: parseFloat(process.env.WHATSAPP_DOCUMENT_COST || "0.04"),
            interactive: parseFloat(
                process.env.WHATSAPP_INTERACTIVE_COST || "0.03"
            ),
        },
    },
};
