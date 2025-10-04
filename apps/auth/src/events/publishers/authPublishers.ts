import { Subjects } from "@repo/common/subjects";
import {
    UserCreatedEvent,
    UserDeletedEvent,
    UserLoggedInEvent,
    UserUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { KafkaPublisher } from "@repo/common-backend/kafka";

const Topic = "auth-event";

export class UserCreatedPublisher extends KafkaPublisher<UserCreatedEvent> {
    subject = Subjects.UserCreated as const;
    topic = Topic;
    protected generateMessageKey(data: UserCreatedEvent["data"]): string {
        return data.id;
    }
}

export class UserLoggedInPublisher extends KafkaPublisher<UserLoggedInEvent> {
    subject = Subjects.UserLoggedIn as const;
    topic = Topic;
    protected generateMessageKey(data: UserLoggedInEvent["data"]): string {
        return data.userId;
    }
}

export class UserUpdatedPublisher extends KafkaPublisher<UserUpdatedEvent> {
    subject = Subjects.UserUpdated as const;
    topic = Topic;

    protected generateMessageKey(data: UserUpdatedEvent["data"]): string {
        return data.updatedBy || data.id;
    }
}

export class UserDeletedPublisher extends KafkaPublisher<UserDeletedEvent> {
    subject = Subjects.UserDeleted as const;
    topic = "auth-event";
    protected generateMessageKey(data: UserDeletedEvent["data"]): string {
        return data.deletedBy || data.id;
    }
}
