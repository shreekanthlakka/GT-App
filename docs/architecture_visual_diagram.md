# 🎨 Visual Architecture Diagram

## Complete Flow: OCR Document → User Notification

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              1. OCR SERVICE                                     │
│                                                                                 │
│  User uploads document → OCR processes → Publishes OCRJobCompletedEvent        │
└────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
                        [Kafka: OCR_PROCESSING_EVENTS Topic]
                                        ↓
┌────────────────────────────────────────────────────────────────────────────────┐
│                       2. NOTIFICATION SERVICE                                   │
│                    OCRProcessingCompletedConsumer                               │
│                                                                                 │
│  • Receives OCR event                                                           │
│  • Gets user info from DB                                                       │
│  • Publishes SendInAppNotificationRequestEvent                                 │
│    (Same pattern as SendEmailRequestEvent/SendSMSRequestEvent)                 │
└────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
                     [Kafka: NOTIFICATION_INAPP_REQUESTS Topic]
                                        ↓
┌────────────────────────────────────────────────────────────────────────────────┐
│                       3. NOTIFICATION SERVICE                                   │
│                SendInAppNotificationRequestConsumer                             │
│                                                                                 │
│  • Receives in-app notification request                                        │
│  • Calls NotificationService.sendInAppNotification()                           │
│     ├─ Saves notification to database                                          │
│     ├─ Sends push notification to mobile (Expo SDK)                            │
│     └─ Sends WebSocket event to web app                                        │
└────────────────────────────────────────────────────────────────────────────────┘
                    ↓                              ↓
                    ↓                              ↓
        ┌───────────┴──────────┐      ┌──────────┴──────────┐
        │   MOBILE DEVICE      │      │     WEB APP         │
        │                      │      │                     │
        │  Push Notification   │      │  WebSocket Update   │
        │  Badge: 1            │      │  Badge Icon: 1      │
        │  "Document Processed"│      │  "Document Processed│
        │                      │      │                     │
        │  [Tap to view]       │      │  [Click to view]    │
        └──────────────────────┘      └─────────────────────┘
```

---

## 🔄 Comparison: All Notification Types

### Email Notification Flow

```
Service → SendEmailRequestPublisher → Kafka Topic
    ↓
SendEmailRequestConsumer → NotificationService.sendEmail()
    ↓
Email Provider (SendGrid/AWS SES) → User's Email
```

### SMS Notification Flow

```
Service → SendSMSRequestPublisher → Kafka Topic
    ↓
SendSMSRequestConsumer → NotificationService.sendSMS()
    ↓
SMS Provider (Twilio/AWS SNS) → User's Phone
```

### WhatsApp Notification Flow

```
Service → SendWhatsAppRequestPublisher → Kafka Topic
    ↓
SendWhatsAppRequestConsumer → NotificationService.sendWhatsApp()
    ↓
WhatsApp Provider → User's WhatsApp
```

### In-App Notification Flow (NEW!)

```
Service → SendInAppNotificationRequestPublisher → Kafka Topic
    ↓
SendInAppNotificationRequestConsumer → NotificationService.sendInAppNotification()
    ↓
├─ Database (Save notification)
├─ Expo Push (Mobile notification)
└─ WebSocket (Web notification)
```

**✨ All follow the same pattern!**

---

## 📊 OCR-Specific Flow Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Step 1: User Uploads Document                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

POST /api/ocr/upload
  - document: invoice.jpg
  - documentType: "invoice"
        ↓
┌───────────────────────────────────────────────────────────────────┐
│ OCR Service                                                        │
│ • Saves file temporarily                                           │
│ • Processes document (extract text, validate, check quality)      │
│ • Publishes: OCRJobCompletedEvent                                 │
└───────────────────────────────────────────────────────────────────┘
        ↓
[Kafka: ocr-processing-events]
        ↓
┌───────────────────────────────────────────────────────────────────┐
│ Notification Service - OCR Consumer                               │
│ • OCRProcessingCompletedConsumer receives event                   │
│ • Checks: requiresReview = false (high confidence)                │
│ • Publishes: SendInAppNotificationRequestEvent                    │
│     {                                                              │
│       title: "Document Processed",                                │
│       message: "Your document is ready",                          │
│       deepLink: "/ocr/details/123"                                │
│     }                                                              │
└───────────────────────────────────────────────────────────────────┘
        ↓
[Kafka: notification-inapp-requests]
        ↓
┌───────────────────────────────────────────────────────────────────┐
│ Notification Service - In-App Consumer                            │
│ • SendInAppNotificationRequestConsumer receives event             │
│ • Calls: NotificationService.sendInAppNotification()              │
│                                                                    │
│   Step A: Save to Database                                        │
│   ────────────────────────                                        │
│   INSERT INTO notifications (                                     │
│     title = "Document Processed",                                 │
│     message = "Your document is ready",                           │
│     status = "SENT",                                              │
│     channel = "IN_APP"                                            │
│   )                                                                │
│                                                                    │
│   Step B: Send Mobile Push                                        │
│   ──────────────────────────                                      │
│   • Get user devices from DB                                      │
│   • Filter valid Expo tokens                                      │
│   • Send via Expo SDK                                             │
│   • Update badge count = 1                                        │
│                                                                    │
│   Step C: Send Web WebSocket                                      │
│   ────────────────────────────                                    │
│   • Emit to user's socket room                                    │
│   • Event: "new_notification"                                     │
│   • Data: { notification, unreadCount: 1 }                        │
└───────────────────────────────────────────────────────────────────┘
        ↓                              ↓
┌──────────────────┐          ┌─────────────────┐
│  Mobile App      │          │    Web App      │
├──────────────────┤          ├─────────────────┤
│ 🔔 PUSH RECEIVED │          │ 🔌 WS RECEIVED  │
│                  │          │                 │
│ Title:           │          │ Notification    │
│ "Document        │          │ Bell: (1)       │
│  Processed"      │          │                 │
│                  │          │ Shows in        │
│ Badge: 1         │          │ dropdown list   │
│                  │          │                 │
│ [Tap opens app]  │          │ [Click to view] │
└──────────────────┘          └─────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Step 2: User Views Notification                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

User clicks notification
        ↓
GET /api/notifications/:id/read
        ↓
UPDATE notifications SET readAt = NOW(), status = 'READ'
        ↓
Badge count: 1 → 0
```

---

## 🎯 Key Architectural Decisions

### Decision 1: Why Publish Instead of Direct DB Write?

**❌ Direct Write (Tightly Coupled):**
```typescript
// OCR Consumer directly writes to notification table
await prisma.notification.create({
    title: "Document Processed",
    // ... other fields
});
```

**Problems:**
- OCR consumer knows about notification structure
- Hard to add features (push, websocket, etc.)
- Doesn't follow existing pattern

**✅ Publisher Pattern (Loosely Coupled):**
```typescript
// OCR Consumer publishes event
await inAppPublisher.publish({
    notification: {
        title: "Document Processed",
        // ... other fields
    }
});
```

**Benefits:**
- Follows same pattern as Email/SMS/WhatsApp
- Easy to extend (add channels, features)
- Separation of concerns
- Can scale independently

---

### Decision 2: Why Two Kafka Hops?

```
OCR Event → Notification Service → In-App Request → Notification Service
```

**Why not just one?**

Because **OCR events are domain-specific**, while **notification requests are generic**.

**Example:**
- `OCRJobCompleted` is specific to OCR domain
- `SendInAppNotificationRequest` is generic notification format
- Same `SendInAppNotificationRequest` can be used by:
  - OCR Service
  - Accounts Service (invoice created)
  - Inventory Service (low stock alert)
  - Any other service

**This enables reusability!**

---

### Decision 3: Synchronous vs Asynchronous

| Type | Processing | Why |
|------|-----------|-----|
| Email | Async via Kafka | External provider (slow, can fail) |
| SMS | Async via Kafka | External provider (slow, can fail) |
| WhatsApp | Async via Kafka | External provider (slow, can fail) |
| In-App | **Async via Kafka** | Consistency with other types |

Even though in-app notification is fast (just DB write), we still use Kafka for:
- **Consistency**: Same pattern everywhere
- **Reliability**: Kafka guarantees delivery
- **Scalability**: Can scale notification workers
- **Monitoring**: Track all notifications in one place

---

## 🔍 Code Walkthrough

### 1. OCR Consumer (apps/notification/src/events/consumers/ocrConsumers.ts)

```typescript
export class OCRProcessingCompletedConsumer {
    async onMessage(data: OCRJobCompletedEvent["data"]) {
        // Get user info
        const user = await prisma.user.findUnique({ 
            where: { id: data.userId } 
        });

        // Publish in-app notification request
        const inAppPublisher = new SendInAppNotificationRequestPublisher(
            kafkaWrapper.producer
        );

        await inAppPublisher.publish({
            recipientId: data.userId,
            recipient: { name: user.name },
            notification: {
                title: "Document Processed",
                message: "Your document is ready",
                deepLink: `/ocr/details/${data.jobId}`,
            },
            // ... metadata
        });
    }
}
```

**What it does:**
- Listens to OCR events
- Transforms OCR data into notification format
- Publishes generic notification request
- Does NOT create notification in DB (that's the in-app consumer's job)

---

### 2. In-App Consumer (apps/notification/src/events/consumers/inAppNotificationConsumer.ts)

```typescript
export class SendInAppNotificationRequestConsumer {
    async onMessage(data: SendInAppNotificationRequestEvent["data"]) {
        const notificationService = new NotificationService();
        const result = await notificationService.sendInAppNotification(data);
    }
}
```

**What it does:**
- Listens to in-app notification requests
- Calls NotificationService (same as Email/SMS/WhatsApp)
- Handles all notification creation logic

---

### 3. NotificationService (apps/notification/src/services/notificationService.ts)

```typescript
class NotificationService {
    async sendInAppNotification(data) {
        // 1. Save to database
        const notification = await prisma.notification.create({...});

        // 2. Send push to mobile devices
        await this.sendMobilePushNotification({
            userId: data.userId,
            title: notification.title,
            body: notification.message,
            badge: unreadCount,
        });

        // 3. Send to web via WebSocket
        await this.sendWebSocketNotification(userId, {
            notification,
            unreadCount,
        });

        return { success: true };
    }

    private async sendMobilePushNotification(params) {
        // Get user's devices
        const devices = await prisma.userDevice.findMany({...});

        // Send via Expo
        const messages = devices.map(device => ({
            to: device.token,
            title: params.title,
            body: params.body,
            badge: params.badge,
        }));

        await expo.sendPushNotificationsAsync(messages);
    }
}
```

**What it does:**
- Creates notification in database
- Sends push notification to all user devices
- Sends WebSocket event to web app
- Same structure as `sendEmail()`, `sendSMS()`, etc.

---

## 🎨 Publisher Comparison Table

| Publisher | Topic | Consumer | Service Method |
|-----------|-------|----------|----------------|
| `SendEmailRequestPublisher` | `notification-email-requests` | `SendEmailRequestConsumer` | `NotificationService.sendEmail()` |
| `SendSMSRequestPublisher` | `notification-sms-requests` | `SendSMSRequestConsumer` | `NotificationService.sendSMS()` |
| `SendWhatsAppRequestPublisher` | `notification-whatsapp-requests` | `SendWhatsAppRequestConsumer` | `NotificationService.sendWhatsApp()` |
| `SendInAppNotificationRequestPublisher` | `notification-inapp-requests` | `SendInAppNotificationRequestConsumer` | `NotificationService.sendInAppNotification()` |

**Perfect symmetry! 🎯**

---

## ✅ Summary

### What You Understood Correctly ✅

1. **Same pattern as Email/SMS/WhatsApp** - Absolutely correct!
2. **Publisher in common-backend package** - Yes!
3. **Consumer in notification service** - Yes!
4. **In-app is synchronous (just DB)** - Correct, but we still use Kafka for consistency

### What's Implemented Now ✅

1. ✅ `SendInAppNotificationRequestPublisher` in common-backend
2. ✅ `SendInAppNotificationRequestConsumer` in notification service
3. ✅ `NotificationService.sendInAppNotification()` method
4. ✅ OCR consumers publish to in-app publisher
5. ✅ Push notifications to mobile (Expo SDK)
6. ✅ WebSocket to web app
7. ✅ Badge counts everywhere

### Architecture Benefits ✅

- **Consistent**: All notifications follow same pattern
- **Scalable**: Can scale each consumer independently
- **Reliable**: Kafka guarantees message delivery
- **Maintainable**: Easy to understand and extend
- **Reusable**: Same in-app publisher used by all services

**This is the correct architecture!** 🎉
