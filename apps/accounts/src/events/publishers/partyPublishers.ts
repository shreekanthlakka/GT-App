import {
    PartyCreatedEvent,
    PartyDeletedEvent,
    PartyGSTUpdatedEvent,
    PartyUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class PartyCreatedPublisher extends KafkaPublisher<PartyCreatedEvent> {
    subject = Subjects.PartyCreated as const;
    topic = TopicNames.PARTY_EVENTS;
    protected generateMessageKey(data: PartyCreatedEvent["data"]): string {
        return data.id;
    }
}

export class PartyUpdatedPublisher extends KafkaPublisher<PartyUpdatedEvent> {
    subject = Subjects.PartyUpdated as const;
    topic = TopicNames.PARTY_EVENTS;

    protected generateMessageKey(data: PartyUpdatedEvent["data"]): string {
        return data.updatedBy || data.id;
    }
}

export class PartyDeletedPublisher extends KafkaPublisher<PartyDeletedEvent> {
    subject = Subjects.PartyDeleted as const;
    topic = TopicNames.PARTY_EVENTS;

    protected generateMessageKey(data: PartyDeletedEvent["data"]): string {
        return data.deletedBy;
    }
}
