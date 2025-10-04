import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";
import { KafkaPublisher } from "../../kafka/base-publisher";
import { SendSMSRequestEvent } from "../interfaces/index";

export class SendSMSRequestPublisher extends KafkaPublisher<SendSMSRequestEvent> {
    subject = Subjects.SendSMSRequested as const;
    topic = TopicNames.NOTIFICATION_SMS_REQUESTS;
    protected generateMessageKey(data: SendSMSRequestEvent["data"]): string {
        return `${data.recipientId}_${data.recipient.phone}`;
    }
}
