import { KafkaPublisher } from "../../kafka/index";
import { Subjects } from "@repo/common/subjects";
import { SendWhatsAppRequestEvent } from "../interfaces/index";
import { TopicNames } from "@repo/common/topics";

export class SendWhatsAppRequestPublisher extends KafkaPublisher<SendWhatsAppRequestEvent> {
    subject = Subjects.SendWhatsAppRequested as const;
    topic = TopicNames.NOTIFICATION_WHATSAPP_REQUESTS;
    protected generateMessageKey(
        data: SendWhatsAppRequestEvent["data"]
    ): string {
        return `${data.recipientId}_${data.recipient.phone}`;
    }
}
