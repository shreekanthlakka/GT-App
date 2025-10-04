import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    WhatsAppFailedEvent,
    WhatsAppSentEvent,
} from "@repo/common-backend/interfaces";
import { TopicNames } from "@repo/common/topics";

export class WhatsappSentPublisher extends KafkaPublisher<WhatsAppSentEvent> {
    subject = Subjects.WhatsAppMessageSent as const;
    topic = TopicNames.NOTIFICATION_WHATSAPP_RESPONSES;
    protected generateMessageKey(data: WhatsAppSentEvent["data"]): string {
        return `${data.recipientType} - ${data.recipientId} - ${data.recipient.phone} `;
    }
}

export class WhatsappFailedPublisher extends KafkaPublisher<WhatsAppFailedEvent> {
    subject = Subjects.WhatsAppMessageFailed as const;
    topic = TopicNames.NOTIFICATION_WHATSAPP_RESPONSES;
    protected generateMessageKey(data: WhatsAppFailedEvent["data"]): string {
        return `${data.recipientType} - ${data.recipientId} - ${data.recipient.phone}`;
    }
}
