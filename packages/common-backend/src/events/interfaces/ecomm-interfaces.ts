// packages/common-backend/src/events/interfaces/ecommerceInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// ECOMMERCE USER LIFECYCLE EVENTS
// ========================================

export interface EcommerceUserCreatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserCreated;
    data: {
        id: string;
        email: string;
        name: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: "MALE" | "FEMALE" | "OTHER";

        // Authentication status
        emailVerified: boolean;
        phoneVerified: boolean;

        // Registration details
        signupSource: "WEBSITE" | "MOBILE_APP" | "SOCIAL" | "REFERRAL";
        referredBy?: string;
        referralCode?: string;

        // Initial preferences
        preferences: {
            newsletter: boolean;
            sms: boolean;
            whatsapp: boolean;
            language: string;
            currency: string;
        };

        // Device and location info
        deviceInfo?: {
            type: "mobile" | "desktop" | "tablet";
            os?: string;
            browser?: string;
        };
        ipAddress?: string;
        location?: {
            country?: string;
            state?: string;
            city?: string;
        };

        createdAt: string;

        // Marketing attribution
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;

        // Welcome process
        welcomeEmailSent: boolean;
        onboardingStarted: boolean;
    };
}

export interface EcommerceUserUpdatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserUpdated;
    data: {
        id: string;
        email: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;

        // Specific change flags
        profileUpdated?: boolean;
        preferencesUpdated?: boolean;
        addressUpdated?: boolean;
        avatarUpdated?: boolean;

        // Impact assessment
        marketingListsAffected?: string[];
        notificationSettingsChanged?: boolean;
        privacySettingsChanged?: boolean;

        updatedBy: "USER" | "ADMIN" | "SYSTEM";
        updateSource:
            | "PROFILE_EDIT"
            | "SETTINGS"
            | "VERIFICATION"
            | "ADMIN_PANEL";
    };
}

export interface EcommerceUserDeletedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserDeleted;
    data: {
        id: string;
        email: string;
        name: string;

        deletedAt: string;
        deletedBy?: string; // Admin who deleted, if applicable
        deletionType:
            | "USER_REQUEST"
            | "ADMIN_ACTION"
            | "COMPLIANCE"
            | "GDPR_REQUEST";

        // Deletion details
        reason?: string;
        gdprCompliant: boolean;
        dataRetentionPeriod: number; // days

        // Impact on related data
        ordersCount: number;
        reviewsCount: number;
        wishlistItemsCount: number;

        // Data handling
        personalDataRemoved: boolean;
        transactionalDataRetained: boolean;
        anonymizationApplied: boolean;

        // Backup for recovery
        backupRetentionDays: number;
        recoveryPossible: boolean;
    };
}

export interface EcommerceUserActivatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserActivated;
    data: {
        id: string;
        email: string;
        name: string;
        activatedAt: string;
        activatedBy: "USER" | "ADMIN" | "SYSTEM";

        activationReason:
            | "EMAIL_VERIFIED"
            | "ADMIN_APPROVAL"
            | "APPEAL_ACCEPTED"
            | "COMPLIANCE_MET"
            | "OTHER";

        // Previous state
        previousStatus:
            | "INACTIVE"
            | "BLOCKED"
            | "SUSPENDED"
            | "PENDING_VERIFICATION";
        inactiveDuration?: number; // hours

        // Restoration details
        accessRestored: boolean;
        ordersReactivated?: number;
        notificationsEnabled: boolean;

        // Communication
        welcomeBackEmailSent: boolean;
        marketingListsRejoined: string[];
    };
}

export interface EcommerceUserDeactivatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserDeactivated;
    data: {
        id: string;
        email: string;
        name: string;
        deactivatedAt: string;
        deactivatedBy: "USER" | "ADMIN" | "SYSTEM";

        deactivationReason:
            | "USER_REQUEST"
            | "INACTIVITY"
            | "SUSPICIOUS_ACTIVITY"
            | "COMPLIANCE_VIOLATION"
            | "PAYMENT_ISSUES"
            | "OTHER";

        // Deactivation details
        temporaryDeactivation: boolean;
        reactivationPossible: boolean;
        reactivationDate?: string;

        // Impact on services
        ordersAffected: number;
        subscriptionsSuspended: number;

        // Data handling
        accessRevoked: boolean;
        sessionsTerminated: boolean;
        notificationsDisabled: boolean;
        marketingListsRemoved: string[];
    };
}

export interface EcommerceUserBlockedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserBlocked;
    data: {
        id: string;
        email: string;
        name: string;
        blockedAt: string;
        blockedBy: string;

        blockReason:
            | "FRAUDULENT_ACTIVITY"
            | "POLICY_VIOLATION"
            | "PAYMENT_FRAUD"
            | "ABUSIVE_BEHAVIOR"
            | "SPAM_ACTIVITIES"
            | "SECURITY_CONCERNS"
            | "OTHER";

        blockType: "TEMPORARY" | "PERMANENT";
        blockDuration?: number; // hours for temporary blocks

        // Security measures
        allSessionsTerminated: boolean;
        ipAddressBlocked?: boolean;
        deviceBlocked?: boolean;

        // Impact assessment
        activeOrdersCancelled: number;
        pendingReturns: number;
        outstandingAmount?: number;

        // Appeals process
        appealPossible: boolean;
        appealDeadline?: string;

        // Compliance
        reportToAuthorities?: boolean;
        lawEnforcementNotified?: boolean;

        // Recovery options
        dataRetained: boolean;
        unblockConditions?: string[];
    };
}

export interface EcommerceUserUnblockedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserUnblocked;
    data: {
        id: string;
        email: string;
        name: string;
        unblockedAt: string;
        unblockedBy: string;

        originalBlockReason: string;
        unblockReason:
            | "APPEAL_SUCCESSFUL"
            | "INVESTIGATION_CLEARED"
            | "PAYMENT_RESOLVED"
            | "POLICY_CHANGE"
            | "MANUAL_REVIEW"
            | "OTHER";

        // Block duration
        blockDuration: number; // hours
        totalBlockTime: number; // total time across all blocks

        // Restoration process
        accessRestored: boolean;
        sessionsAllowed: boolean;
        ordersReactivated?: number;

        // Monitoring
        probationPeriod?: number; // days
        enhancedMonitoring: boolean;
        restrictionsRemaining?: string[];

        // Communication
        unblockedNotificationSent: boolean;
        termsAcknowledgmentRequired?: boolean;
    };
}

// ========================================
// ECOMMERCE AUTHENTICATION EVENTS
// ========================================

export interface EcommerceUserLoggedInEvent extends BaseEvent {
    subject: Subjects.EcommerceUserLoggedIn;
    data: {
        userId: string;
        email: string;
        name: string;

        // Login details
        loginMethod: "EMAIL_PASSWORD" | "SOCIAL_LOGIN" | "OTP" | "BIOMETRIC";
        socialProvider?: "GOOGLE" | "FACEBOOK" | "APPLE";

        // Session information
        sessionId: string;
        sessionDuration?: number; // expected duration in hours
        rememberMe: boolean;

        // Device and location
        deviceInfo: {
            type: "mobile" | "desktop" | "tablet";
            os?: string;
            browser?: string;
            version?: string;
            userAgent?: string;
        };
        ipAddress?: string;
        location?: {
            country?: string;
            state?: string;
            city?: string;
        };

        // Security checks
        riskScore?: number; // 0-100
        isSuspiciousLogin: boolean;
        newDevice: boolean;
        newLocation: boolean;

        // Previous login context
        lastLoginAt?: string;
        daysSinceLastLogin?: number;
        consecutiveFailedAttempts?: number;

        loginAt: string;

        // Behavior tracking
        cartItemsCount?: number;
        wishlistItemsCount?: number;

        // Security actions
        twoFactorRequired?: boolean;
        verificationSent?: boolean;
        securityAlertSent?: boolean;
    };
}

export interface EcommerceUserLoggedOutEvent extends BaseEvent {
    subject: Subjects.EcommerceUserLoggedOut;
    data: {
        userId: string;
        sessionId: string;

        // Logout details
        logoutMethod:
            | "USER_ACTION"
            | "SESSION_TIMEOUT"
            | "FORCED_LOGOUT"
            | "SECURITY_LOGOUT";
        logoutReason?: string;

        // Session stats
        sessionDuration: number; // minutes
        pagesViewed?: number;
        itemsViewedCount?: number;
        cartInteractions?: number;

        // Activity during session
        ordersPlaced?: number;
        itemsAddedToCart?: number;
        itemsAddedToWishlist?: number;
        reviewsSubmitted?: number;

        // Device info
        deviceType: "mobile" | "desktop" | "tablet";
        browser?: string;

        loggedOutAt: string;

        // Cart preservation
        cartSaved: boolean;
        cartItemsCount?: number;

        // Follow-up actions
        remindersScheduled?: boolean;
        emailSequenceTriggered?: string;
    };
}

export interface EcommerceUserLoginFailedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserLoginFailed;
    data: {
        email: string;

        // Failure details
        failureReason:
            | "INVALID_CREDENTIALS"
            | "ACCOUNT_BLOCKED"
            | "ACCOUNT_INACTIVE"
            | "EMAIL_NOT_VERIFIED"
            | "TOO_MANY_ATTEMPTS"
            | "SECURITY_LOCKOUT"
            | "ACCOUNT_NOT_FOUND";

        // Attempt tracking
        attemptNumber: number;
        maxAttemptsAllowed: number;
        attemptsRemaining: number;

        // Security information
        ipAddress?: string;
        deviceFingerprint?: string;
        userAgent?: string;

        // Risk assessment
        riskScore?: number;
        suspiciousActivity?: boolean;

        // Response actions
        accountLockoutTriggered?: boolean;
        lockoutDuration?: number; // minutes
        captchaRequired?: boolean;
        securityNotificationSent?: boolean;

        // Recovery options
        passwordResetOffered?: boolean;
        accountRecoveryStarted?: boolean;

        failedAt: string;

        // Geographic context
        location?: {
            country?: string;
            state?: string;
            city?: string;
        };

        // Previous success context
        lastSuccessfulLogin?: string;
        accountCreatedDays?: number;
    };
}

// ========================================
// EMAIL & PHONE VERIFICATION EVENTS
// ========================================

export interface EcommerceUserEmailVerifiedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserEmailVerified;
    data: {
        userId: string;
        email: string;
        verifiedAt: string;

        // Verification process
        verificationMethod: "EMAIL_LINK" | "EMAIL_CODE" | "ADMIN_OVERRIDE";
        verificationToken?: string;

        // Timing details
        verificationRequestedAt?: string;
        timeToVerify?: number; // minutes
        attemptsBeforeSuccess?: number;

        // Impact on account
        accountFullyActivated: boolean;
        welcomeBonusEligible?: boolean;
        premiumFeaturesUnlocked?: string[];

        // First-time user bonuses
        firstPurchaseDiscountApplied?: boolean;
        loyaltyPointsAwarded?: number;

        // Device info
        deviceType?: "mobile" | "desktop" | "tablet";
        verificationSource?: "REGISTRATION" | "PROFILE_UPDATE" | "CHECKOUT";
    };
}

export interface EcommerceUserPhoneVerifiedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserPhoneVerified;
    data: {
        userId: string;
        phone: string;
        verifiedAt: string;

        // Verification details
        verificationMethod:
            | "SMS_OTP"
            | "CALL_OTP"
            | "WHATSAPP_OTP"
            | "ADMIN_OVERRIDE";
        otpCode?: string;

        // Process timing
        verificationRequestedAt?: string;
        timeToVerify?: number; // minutes
        attemptsBeforeSuccess?: number;

        // Enhanced features unlocked
        whatsappNotificationsEnabled: boolean;
        smsNotificationsEnabled: boolean;
        codDeliveryEnabled?: boolean;

        // Security benefits
        twoFactorEligible: boolean;
        accountSecurityScore?: number;

        // Marketing implications
        smsMarketingOptIn: boolean;
        whatsappMarketingOptIn: boolean;

        deviceType?: "mobile" | "desktop" | "tablet";
    };
}

export interface EcommerceUserEmailVerificationSentEvent extends BaseEvent {
    subject: Subjects.EcommerceUserEmailVerificationSent;
    data: {
        userId: string;
        email: string;
        sentAt: string;

        // Email details
        emailType:
            | "WELCOME_VERIFICATION"
            | "RESEND_VERIFICATION"
            | "PROFILE_CHANGE_VERIFICATION";
        emailTemplate: string;
        verificationToken: string;
        expiresAt: string;

        // Sending details
        emailProvider: "SENDGRID" | "AWS_SES" | "MAILGUN" | "OTHER";
        messageId?: string;

        // Context
        attemptNumber: number;
        maxAttemptsAllowed: number;
        lastSentAt?: string;

        // Delivery tracking
        deliveryExpected: boolean;
        trackingEnabled: boolean;
    };
}

export interface EcommerceUserPhoneVerificationSentEvent extends BaseEvent {
    subject: Subjects.EcommerceUserPhoneVerificationSent;
    data: {
        userId: string;
        phone: string;
        sentAt: string;

        // SMS/Call details
        verificationType: "SMS_OTP" | "CALL_OTP" | "WHATSAPP_OTP";
        otpCode: string; // Usually masked in logs
        expiresAt: string;

        // Provider details
        smsProvider: "TWILIO" | "AWS_SNS" | "TEXTLOCAL" | "OTHER";
        messageId?: string;
        cost?: number;

        // Context
        attemptNumber: number;
        maxAttemptsAllowed: number;
        lastSentAt?: string;

        // Delivery status
        deliveryStatus: "SENT" | "DELIVERED" | "FAILED" | "PENDING";
        failureReason?: string;
    };
}

// ========================================
// PROFILE & ADDRESS MANAGEMENT EVENTS
// ========================================

export interface EcommerceUserProfileUpdatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserProfileUpdated;
    data: {
        userId: string;
        email: string;
        updatedAt: string;

        // Profile changes
        profileChanges: {
            name?: { oldValue: string; newValue: string };
            phone?: { oldValue?: string; newValue?: string };
            dateOfBirth?: { oldValue?: string; newValue?: string };
            gender?: { oldValue?: string; newValue?: string };
            avatar?: { oldValue?: string; newValue?: string };
        };

        // Verification impacts
        phoneVerificationReset?: boolean;
        emailVerificationReset?: boolean;

        // Profile completion
        profileCompleteness: number; // percentage
        profileCompletionIncreased: boolean;
        missingFields?: string[];

        updateSource: "USER_EDIT" | "SOCIAL_SYNC" | "ADMIN_UPDATE" | "IMPORT";
        updatedFields: string[];
    };
}

export interface EcommerceUserAddressAddedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserAddressAdded;
    data: {
        userId: string;
        addressId: string;

        // Address details
        addressType: "HOME" | "OFFICE" | "OTHER";
        name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        isDefault: boolean;

        // Context
        addedAt: string;
        addedDuring:
            | "REGISTRATION"
            | "CHECKOUT"
            | "PROFILE_MANAGEMENT"
            | "ORDER_PLACEMENT";

        // Address validation
        validated: boolean;
        deliverable: boolean;
        serviceableForDelivery: boolean;
        estimatedDeliveryDays?: number;

        // User address stats
        totalAddresses: number;
        isFirstAddress: boolean;

        // Geographic insights
        newServiceArea: boolean;
        deliveryZone?: string;
    };
}

export interface EcommerceUserAddressUpdatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserAddressUpdated;
    data: {
        userId: string;
        addressId: string;
        updatedAt: string;

        // Changes made
        changes: Record<string, { oldValue: any; newValue: any }>;

        // Impact assessment
        defaultAddressChanged: boolean;
        deliverabilityChanged: boolean;
        serviceAreaChanged: boolean;

        // Validation results
        revalidationRequired: boolean;
        stillDeliverable: boolean;
        newEstimatedDeliveryDays?: number;

        // Active orders impact
        activeOrdersAffected: number;
        orderUpdatesRequired: boolean;
    };
}

export interface EcommerceUserAddressDeletedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserAddressDeleted;
    data: {
        userId: string;
        addressId: string;
        deletedAt: string;

        // Deleted address details (for analytics)
        wasDefault: boolean;
        addressType: "HOME" | "OFFICE" | "OTHER";
        city: string;
        state: string;
        pincode: string;

        // Impact on user account
        remainingAddresses: number;
        newDefaultAddress?: string;

        // Active orders impact
        activeOrdersAffected: number;
        alternativeAddressRequired: boolean;

        // Cleanup actions
        deliveryPreferencesUpdated: boolean;
    };
}

export interface EcommerceUserPreferencesUpdatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserPreferencesUpdated;
    data: {
        userId: string;
        updatedAt: string;

        // Preference changes
        preferenceChanges: {
            newsletter?: { oldValue: boolean; newValue: boolean };
            sms?: { oldValue: boolean; newValue: boolean };
            whatsapp?: { oldValue: boolean; newValue: boolean };
            push?: { oldValue: boolean; newValue: boolean };
            language?: { oldValue: string; newValue: string };
            currency?: { oldValue: string; newValue: string };
        };

        // Notification preferences
        notificationChanges?: {
            orderUpdates?: { oldValue: boolean; newValue: boolean };
            promotions?: { oldValue: boolean; newValue: boolean };
            newArrivals?: { oldValue: boolean; newValue: boolean };
            priceAlerts?: { oldValue: boolean; newValue: boolean };
        };

        // Marketing impact
        marketingListChanges: {
            subscribed: string[];
            unsubscribed: string[];
        };

        // Privacy settings
        privacyChanges?: {
            dataProcessingConsent?: boolean;
            marketingConsent?: boolean;
            analyticsOptOut?: boolean;
        };

        updateSource:
            | "USER_SETTINGS"
            | "UNSUBSCRIBE_LINK"
            | "GDPR_REQUEST"
            | "ADMIN_UPDATE";
    };
}

// ========================================
// SOCIAL LOGIN EVENTS
// ========================================

export interface EcommerceUserSocialLoginLinkedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserSocialLoginLinked;
    data: {
        userId: string;
        provider: "GOOGLE" | "FACEBOOK" | "APPLE";
        providerId: string;
        providerEmail?: string;

        // Link process
        linkedAt: string;
        linkMethod: "DURING_REGISTRATION" | "ACCOUNT_SETTINGS" | "LOGIN_FLOW";

        // Profile sync
        profileDataSynced: boolean;
        syncedFields?: string[];
        conflictingData?: Record<string, { existing: any; provider: any }>;

        // Security benefits
        additionalSecurityLayer: boolean;
        loginMethodsCount: number;

        // Account enhancement
        profilePictureUpdated?: boolean;
        additionalEmailVerified?: boolean;
    };
}

export interface EcommerceUserSocialLoginUnlinkedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserSocialLoginUnlinked;
    data: {
        userId: string;
        provider: "GOOGLE" | "FACEBOOK" | "APPLE";
        providerId: string;

        unlinkedAt: string;
        unlinkReason:
            | "USER_REQUEST"
            | "SECURITY_CONCERN"
            | "PROVIDER_DEACTIVATED"
            | "ACCOUNT_MERGE";

        // Impact on login methods
        remainingLoginMethods: string[];
        passwordRequired: boolean;

        // Security implications
        securityLevelReduced: boolean;
        additionalVerificationRequired?: boolean;

        // Data cleanup
        providerDataRemoved: boolean;
        profilePictureReverted?: boolean;
    };
}

// ========================================
// SESSION MANAGEMENT EVENTS
// ========================================

export interface EcommerceUserSessionCreatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserSessionCreated;
    data: {
        userId: string;
        sessionId: string;
        sessionToken: string; // Usually masked

        createdAt: string;
        expiresAt: string;

        // Device information
        deviceInfo: {
            type: "mobile" | "desktop" | "tablet";
            os?: string;
            browser?: string;
            version?: string;
            userAgent: string;
        };

        // Location details
        ipAddress: string;
        location?: {
            country?: string;
            state?: string;
            city?: string;
        };

        // Session characteristics
        rememberMe: boolean;
        sessionDuration: number; // hours

        // Security context
        riskScore?: number;
        isSecure: boolean;

        // User context
        activeSessions: number;
        cartItemsCount?: number;
        wishlistItemsCount?: number;
    };
}

export interface EcommerceUserSessionExpiredEvent extends BaseEvent {
    subject: Subjects.EcommerceUserSessionExpired;
    data: {
        userId: string;
        sessionId: string;
        expiredAt: string;

        // Session details
        sessionDuration: number; // actual duration in minutes
        plannedDuration: number; // original planned duration in hours

        // Activity during session
        activitySummary: {
            pagesViewed: number;
            productsViewed: number;
            cartInteractions: number;
            wishlistInteractions: number;
            ordersPlaced: number;
        };

        // Expiration context
        expirationType:
            | "NATURAL_TIMEOUT"
            | "EXTENDED_INACTIVITY"
            | "SECURITY_POLICY";
        lastActivityAt: string;
        inactivityDuration: number; // minutes

        // Cart preservation
        cartPreserved: boolean;
        cartItemsCount?: number;

        // Follow-up actions
        reengagementTriggered?: boolean;
        cartReminderScheduled?: boolean;

        deviceType: "mobile" | "desktop" | "tablet";
    };
}

export interface EcommerceUserSessionTerminatedEvent extends BaseEvent {
    subject: Subjects.EcommerceUserSessionTerminated;
    data: {
        userId: string;
        sessionId: string;
        terminatedAt: string;

        // Termination details
        terminationReason:
            | "USER_LOGOUT"
            | "ADMIN_ACTION"
            | "SECURITY_BREACH"
            | "PASSWORD_CHANGE"
            | "ACCOUNT_LOCKED"
            | "SUSPICIOUS_ACTIVITY";

        terminatedBy: "USER" | "ADMIN" | "SYSTEM" | "SECURITY_SYSTEM";

        // Session statistics
        sessionDuration: number; // minutes
        activities: {
            pagesViewed: number;
            ordersPlaced: number;
            itemsAddedToCart: number;
        };

        // Security context
        securityIncident: boolean;
        forcedTermination: boolean;
        allSessionsTerminated?: boolean;

        // Device details
        deviceType: "mobile" | "desktop" | "tablet";
        ipAddress?: string;

        // User notification
        userNotified: boolean;
        securityAlertSent?: boolean;
    };
}

// ========================================
// EXPORT ALL ECOMMERCE EVENT TYPES
// ========================================

export type EcommerceUserEventTypes =
    | EcommerceUserCreatedEvent
    | EcommerceUserUpdatedEvent
    | EcommerceUserDeletedEvent
    | EcommerceUserActivatedEvent
    | EcommerceUserDeactivatedEvent
    | EcommerceUserBlockedEvent
    | EcommerceUserUnblockedEvent
    | EcommerceUserLoggedInEvent
    | EcommerceUserLoggedOutEvent
    | EcommerceUserLoginFailedEvent
    | EcommerceUserEmailVerifiedEvent
    | EcommerceUserPhoneVerifiedEvent
    | EcommerceUserEmailVerificationSentEvent
    | EcommerceUserPhoneVerificationSentEvent
    | EcommerceUserProfileUpdatedEvent
    | EcommerceUserAddressAddedEvent
    | EcommerceUserAddressUpdatedEvent
    | EcommerceUserAddressDeletedEvent
    | EcommerceUserPreferencesUpdatedEvent
    | EcommerceUserSocialLoginLinkedEvent
    | EcommerceUserSocialLoginUnlinkedEvent
    | EcommerceUserSessionCreatedEvent
    | EcommerceUserSessionExpiredEvent
    | EcommerceUserSessionTerminatedEvent;
