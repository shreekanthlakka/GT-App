// packages/common-backend/src/events/interfaces/userInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// USER LIFECYCLE EVENTS
// ========================================

export interface UserCreatedEvent extends BaseEvent {
    subject: Subjects.UserCreated;
    data: {
        id: string;
        email: string;
        name: string;
        phone?: string;
        role: string;
        isActive: boolean;
        createdAt: string;
    };
}

export interface UserUpdatedEvent extends BaseEvent {
    subject: Subjects.UserUpdated;
    data: {
        id: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy?: string;
    };
}

export interface UserDeletedEvent extends BaseEvent {
    subject: Subjects.UserDeleted;
    data: {
        id: string;
        email: string;
        deletedAt: string;
        deletedBy?: string;
        reason?: string;
    };
}

export interface UserActivatedEvent extends BaseEvent {
    subject: Subjects.UserActivated;
    data: {
        id: string;
        email: string;
        name: string;
        activatedBy: string;
        activatedAt: string;
        reason?: string;
    };
}

export interface UserDeactivatedEvent extends BaseEvent {
    subject: Subjects.UserDeactivated;
    data: {
        id: string;
        email: string;
        name: string;
        deactivatedBy: string;
        deactivatedAt: string;
        reason?: string;
    };
}

export interface UserRoleChangedEvent extends BaseEvent {
    subject: Subjects.UserRoleChanged;
    data: {
        id: string;
        email: string;
        name: string;
        oldRole: string;
        newRole: string;
        changedBy: string;
        changedAt: string;
        reason?: string;
    };
}

export interface UserPasswordChangedEvent extends BaseEvent {
    subject: Subjects.UserPasswordChanged;
    data: {
        id: string;
        email: string;
        changedAt: string;
        isReset: boolean;
        initiatedBy?: string;
    };
}

// ========================================
// AUTHENTICATION EVENTS
// ========================================

export interface UserLoggedInEvent extends BaseEvent {
    subject: Subjects.UserLoggedIn;
    data: {
        userId: string;
        email: string;
        sessionId: string;
        ipAddress?: string;
        userAgent?: string;
        loginAt: string;
        loginMethod?: "PASSWORD" | "SSO" | "2FA";
    };
}

export interface UserLoggedOutEvent extends BaseEvent {
    subject: Subjects.UserLoggedOut;
    data: {
        userId: string;
        sessionId: string;
        logoutAt: string;
        logoutType: "MANUAL" | "TIMEOUT" | "FORCED";
    };
}

export interface UserLoginFailedEvent extends BaseEvent {
    subject: Subjects.UserLoginFailed;
    data: {
        email: string;
        ipAddress?: string;
        userAgent?: string;
        reason:
            | "INVALID_CREDENTIALS"
            | "ACCOUNT_LOCKED"
            | "ACCOUNT_DISABLED"
            | "TOO_MANY_ATTEMPTS";
        attemptAt: string;
        failureCount?: number;
    };
}

export interface UserTokenRefreshedEvent extends BaseEvent {
    subject: Subjects.UserTokenRefreshed;
    data: {
        userId: string;
        sessionId: string;
        oldTokenId: string;
        newTokenId: string;
        refreshedAt: string;
        ipAddress?: string;
    };
}

export interface UserPasswordResetRequestedEvent extends BaseEvent {
    subject: Subjects.UserPasswordResetRequested;
    data: {
        userId: string;
        email: string;
        resetToken: string;
        requestedAt: string;
        ipAddress?: string;
        expiresAt: string;
    };
}

export interface UserPasswordResetCompletedEvent extends BaseEvent {
    subject: Subjects.UserPasswordResetCompleted;
    data: {
        userId: string;
        email: string;
        resetToken: string;
        completedAt: string;
        ipAddress?: string;
    };
}

// ========================================
// SESSION MANAGEMENT EVENTS
// ========================================

export interface SessionCreatedEvent extends BaseEvent {
    subject: Subjects.SessionCreated;
    data: {
        sessionId: string;
        userId: string;
        expiresAt: string;
        deviceInfo?: {
            browser?: string;
            os?: string;
            device?: string;
            isMobile?: boolean;
        };
        ipAddress?: string;
        userAgent?: string;
        createdAt: string;
    };
}

export interface SessionExpiredEvent extends BaseEvent {
    subject: Subjects.SessionExpired;
    data: {
        sessionId: string;
        userId: string;
        expiredAt: string;
        expirationType: "NATURAL" | "TIMEOUT" | "SECURITY";
    };
}

export interface SessionTerminatedEvent extends BaseEvent {
    subject: Subjects.SessionTerminated;
    data: {
        sessionId: string;
        userId: string;
        terminatedAt: string;
        terminatedBy?: string;
        reason:
            | "USER_REQUEST"
            | "ADMIN_ACTION"
            | "SECURITY_BREACH"
            | "DUPLICATE_LOGIN";
    };
}

// ========================================
// SECURITY EVENTS
// ========================================

export interface SuspiciousActivityDetectedEvent extends BaseEvent {
    subject: Subjects.SuspiciousActivityDetected;
    data: {
        userId?: string;
        activityType:
            | "MULTIPLE_FAILED_LOGINS"
            | "UNUSUAL_LOCATION"
            | "SUSPICIOUS_USER_AGENT"
            | "RATE_LIMIT_EXCEEDED"
            | "ACCOUNT_ENUMERATION";
        description: string;
        ipAddress?: string;
        userAgent?: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        detectedAt: string;
        metadata?: {
            attemptCount?: number;
            timeWindow?: string;
            location?: string;
            previousLocation?: string;
            [key: string]: any;
        };
        actionTaken?: "NONE" | "RATE_LIMITED" | "ACCOUNT_LOCKED" | "IP_BLOCKED";
    };
}

export interface UserAccountLockedEvent extends BaseEvent {
    subject: Subjects.UserAccountLocked;
    data: {
        userId: string;
        email: string;
        name: string;
        lockedAt: string;
        lockedBy?: string;
        reason:
            | "TOO_MANY_FAILED_ATTEMPTS"
            | "SUSPICIOUS_ACTIVITY"
            | "ADMIN_ACTION"
            | "SECURITY_POLICY";
        lockDuration?: number; // in seconds
        unlockAt?: string;
        failedAttempts?: number;
    };
}

export interface AccessAttemptFailedEvent extends BaseEvent {
    subject: Subjects.AccessAttemptFailed;
    data: {
        userId?: string;
        email?: string;
        resource: string;
        action: string;
        reason:
            | "INSUFFICIENT_PERMISSIONS"
            | "RESOURCE_NOT_FOUND"
            | "RATE_LIMITED"
            | "MAINTENANCE_MODE";
        ipAddress?: string;
        userAgent?: string;
        attemptedAt: string;
        requiredRole?: string;
        userRole?: string;
    };
}

// ========================================
// EXPORT ALL USER EVENT TYPES
// ========================================

export type UserEventTypes =
    | UserCreatedEvent
    | UserUpdatedEvent
    | UserDeletedEvent
    | UserActivatedEvent
    | UserDeactivatedEvent
    | UserRoleChangedEvent
    | UserPasswordChangedEvent
    | UserLoggedInEvent
    | UserLoggedOutEvent
    | UserLoginFailedEvent
    | UserTokenRefreshedEvent
    | UserPasswordResetRequestedEvent
    | UserPasswordResetCompletedEvent
    | SessionCreatedEvent
    | SessionExpiredEvent
    | SessionTerminatedEvent
    | SuspiciousActivityDetectedEvent
    | UserAccountLockedEvent
    | AccessAttemptFailedEvent;
