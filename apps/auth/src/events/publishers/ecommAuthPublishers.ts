import {
    EcommerceUserCreatedEvent,
    EcommerceUserEmailVerifiedEvent,
    EcommerceUserLoggedInEvent,
    EcommerceUserLoggedOutEvent,
    EcommerceUserLoginFailedEvent,
    EcommerceUserPhoneVerifiedEvent,
    EcommerceUserSessionCreatedEvent,
} from "@repo/common-backend/interfaces";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { Subjects } from "@repo/common/subjects";

const Topic = "Ecomm-authEvent";

class EcommerceUserCreatedPublisher extends KafkaPublisher<EcommerceUserCreatedEvent> {
    subject = Subjects.EcommerceUserCreated as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserCreatedEvent["data"]
    ): string {
        return data.id;
    }
}

class EcommerceUserLoggedInPublisher extends KafkaPublisher<EcommerceUserLoggedInEvent> {
    subject = Subjects.EcommerceUserLoggedIn as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserLoggedInEvent["data"]
    ): string {
        return `${data.email} - ${data.ecommerceUserId}`;
    }
}

class EcommerceUserLoggedOutPublisher extends KafkaPublisher<EcommerceUserLoggedOutEvent> {
    subject = Subjects.EcommerceUserLoggedOut as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserLoggedOutEvent["data"]
    ): string {
        return `${data.ecommerceUserId} - ${data.loggedOutAt}`;
    }
}

// class EcommerceUserLogginFailedPublisher extends KafkaPublisher<> {
//     subject = Subjects.EcommerceUserLoggedIn as const;
//     topic = Topic;
//     protected generateMessageKey(
//         data: EcommerceUserLoggedInEvent["data"]
//     ): string {
//         return data.userId;
//     }
// }

class EcommerceUserEmailVerifiedPublisher extends KafkaPublisher<EcommerceUserEmailVerifiedEvent> {
    subject = Subjects.EcommerceUserEmailVerified as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserEmailVerifiedEvent["data"]
    ): string {
        return `${data.ecommerceUserId} - ${data.email}`;
    }
}

class EcommerceUserPhoneVerifiedPublisher extends KafkaPublisher<EcommerceUserPhoneVerifiedEvent> {
    subject = Subjects.EcommerceUserPhoneVerified as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserPhoneVerifiedEvent["data"]
    ): string {
        return `${data.ecommerceUserId} - ${data.phone}`;
    }
}

class EcommerceUserLoginFailedPublisher extends KafkaPublisher<EcommerceUserLoginFailedEvent> {
    subject = Subjects.EcommerceUserLoginFailed as const;
    topic = Topic;
    protected generateMessageKey(
        data: EcommerceUserLoginFailedEvent["data"]
    ): string {
        return data.email;
    }
}

class EcommerceUserSessionCreatedPublisher extends KafkaPublisher<EcommerceUserSessionCreatedEvent> {
    subject = Subjects.EcommerceUserSessionCreated as const;
    topic = Topic; // Uses AUTH_SESSION_EVENTS

    protected generateMessageKey(
        data: EcommerceUserSessionCreatedEvent["data"]
    ): string {
        return `${data.ecommerceUserId}-${data.sessionId}`;
    }
}

export {
    EcommerceUserCreatedPublisher,
    EcommerceUserLoggedInPublisher,
    EcommerceUserLoggedOutPublisher,
    EcommerceUserLoginFailedPublisher,
    EcommerceUserEmailVerifiedPublisher,
    EcommerceUserPhoneVerifiedPublisher,
    EcommerceUserSessionCreatedPublisher,
};
