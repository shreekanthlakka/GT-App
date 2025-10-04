import { KafkaPublisher } from "../../kafka/index";
import { Subjects } from "@repo/common/subjects";
import { SendEmailRequestEvent } from "../interfaces/index";
import { TopicNames } from "@repo/common/topics";

export class SendEmailRequestPublisher extends KafkaPublisher<SendEmailRequestEvent> {
    subject = Subjects.SendEmailRequested as const;
    topic = TopicNames.NOTIFICATION_EMAIL_REQUESTS;
    protected generateMessageKey(data: SendEmailRequestEvent["data"]): string {
        return `${data.recipientId}_${data.recipient.email.split("@")[1]}`;
    }
}
