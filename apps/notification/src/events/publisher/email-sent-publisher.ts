import { KafkaPublisher } from "@repo/common-backend/kafka";
import { Subjects } from "@repo/common/subjects";
import {
    EmailFailedEvent,
    EmailSentEvent,
} from "@repo/common-backend/interfaces";
import { TopicNames } from "@repo/common/topics";

export class EmailSentPublisher extends KafkaPublisher<EmailSentEvent> {
    subject = Subjects.EmailSent as const;
    topic = TopicNames.NOTIFICATION_EMAIL_RESPONSES;
    protected generateMessageKey(data: EmailSentEvent["data"]): string {
        return `${data.recipientId} - ${data.email}`;
    }
}

export class EmailFailedPublisher extends KafkaPublisher<EmailFailedEvent> {
    subject = Subjects.EmailFailed as const;
    topic = TopicNames.NOTIFICATION_EMAIL_RESPONSES;
    protected generateMessageKey(data: EmailFailedEvent["data"]): string {
        return `${data.recipientId} - ${data.email}`;
    }
}
