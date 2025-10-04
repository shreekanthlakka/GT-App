import { KafkaPublisher } from "@repo/common-backend/kafka";
import { Subjects } from "@repo/common/subjects";
import { SMSFailedEvent, SMSSentEvent } from "@repo/common-backend/interfaces";
import { TopicNames } from "@repo/common/topics";

export class SMSSentPublisher extends KafkaPublisher<SMSSentEvent> {
    subject = Subjects.SMSMessageSent as const;
    topic = TopicNames.NOTIFICATION_SMS_RESPONSES;
    protected generateMessageKey(data: SMSSentEvent["data"]): string {
        return `${data.recipientId} - ${data.recipient.phone}`;
    }
}

export class SMSFailedPublisher extends KafkaPublisher<SMSFailedEvent> {
    subject = Subjects.SMSMessageFailed as const;
    topic = TopicNames.NOTIFICATION_SMS_RESPONSES;
    protected generateMessageKey(data: SMSFailedEvent["data"]): string {
        return `${data.recipientId} - ${data.recipient.phone}`;
    }
}
