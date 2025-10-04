// packages/common-backend/src/events/interfaces/systemInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// SYSTEM LIFECYCLE EVENTS
// ========================================

export interface SystemStartedEvent extends BaseEvent {
    subject: Subjects.SystemStarted;
    data: {
        serviceName: string;
        version: string;
        environment: "development" | "staging" | "production";
        startedAt: string;
        configurationLoaded: boolean;
        dependenciesChecked: boolean;
        healthCheckPassed: boolean;
        startupTime: number; // milliseconds
        resourceUsage: {
            memoryUsage: number; // MB
            cpuUsage: number; // percentage
            diskUsage: number; // percentage
        };
        externalServices: Array<{
            name: string;
            status: "CONNECTED" | "DISCONNECTED" | "ERROR";
            responseTime?: number;
        }>;
    };
}

export interface SystemShutdownEvent extends BaseEvent {
    subject: Subjects.SystemShutdown;
    data: {
        serviceName: string;
        reason:
            | "GRACEFUL"
            | "FORCED"
            | "ERROR"
            | "MAINTENANCE"
            | "DEPLOYMENT"
            | "RESOURCE_EXHAUSTION";
        shutdownAt: string;
        uptime: number; // seconds
        gracefulShutdown: boolean;
        cleanupCompleted: boolean;
        dataConsistencyMaintained: boolean;
        activeConnections: number;
        pendingTransactions: number;
        lastRequestTime?: string;
        errorDetails?: string;
    };
}

export interface SystemHealthCheckPerformedEvent extends BaseEvent {
    subject: Subjects.SystemHealthCheckPerformed;
    data: {
        serviceName: string;
        checkType: "STARTUP" | "PERIODIC" | "ON_DEMAND" | "FAILURE_TRIGGERED";
        overallStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "CRITICAL";
        components: Array<{
            name: string;
            status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
            responseTime?: number;
            errorMessage?: string;
            lastCheck: string;
        }>;
        metrics: {
            memoryUsage: number;
            cpuUsage: number;
            diskUsage: number;
            networkLatency?: number;
            databaseResponseTime?: number;
            queueDepth?: number;
        };
        checkedAt: string;
        duration: number; // milliseconds
        alertsTriggered: number;
        actionRequired: boolean;
        recommendedActions?: string[];
    };
}

export interface SystemMaintenanceStartedEvent extends BaseEvent {
    subject: Subjects.SystemMaintenanceStarted;
    data: {
        maintenanceId: string;
        maintenanceType:
            | "SCHEDULED"
            | "EMERGENCY"
            | "SECURITY_PATCH"
            | "FEATURE_DEPLOYMENT"
            | "DATABASE_MAINTENANCE";
        serviceName: string;
        startedAt: string;
        estimatedDuration: number; // minutes
        expectedCompletionTime: string;
        maintenanceWindow: {
            startTime: string;
            endTime: string;
        };
        affectedServices: string[];
        impactLevel: "MINIMAL" | "MODERATE" | "SIGNIFICANT" | "CRITICAL";
        userNotified: boolean;
        backupCompleted: boolean;
        rollbackPlanReady: boolean;
        maintenancePerson: string;
        approvedBy?: string;
    };
}

export interface SystemMaintenanceCompletedEvent extends BaseEvent {
    subject: Subjects.SystemMaintenanceCompleted;
    data: {
        maintenanceId: string;
        serviceName: string;
        completedAt: string;
        actualDuration: number; // minutes
        status: "SUCCESSFUL" | "PARTIAL_SUCCESS" | "FAILED" | "ROLLED_BACK";
        tasksCompleted: string[];
        tasksSkipped?: string[];
        issuesEncountered?: string[];
        performanceImpact: {
            beforeMaintenance: {
                responseTime: number;
                throughput: number;
                errorRate: number;
            };
            afterMaintenance: {
                responseTime: number;
                throughput: number;
                errorRate: number;
            };
        };
        verificationTests: Array<{
            testName: string;
            status: "PASSED" | "FAILED";
            details?: string;
        }>;
        rollbackRequired: boolean;
        nextMaintenanceScheduled?: string;
    };
}

export interface SystemUpdatedEvent extends BaseEvent {
    subject: Subjects.SystemUpdated;
    data: {
        serviceName: string;
        updateType:
            | "FEATURE"
            | "BUGFIX"
            | "SECURITY_PATCH"
            | "CONFIGURATION"
            | "DEPENDENCY";
        oldVersion: string;
        newVersion: string;
        updateId: string;
        updatedAt: string;
        updateMethod: "BLUE_GREEN" | "ROLLING" | "CANARY" | "DIRECT";
        rollbackAvailable: boolean;
        preUpdateChecks: Array<{
            checkName: string;
            status: "PASSED" | "FAILED";
        }>;
        postUpdateChecks: Array<{
            checkName: string;
            status: "PASSED" | "FAILED";
        }>;
        migrationRequired: boolean;
        migrationStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
        downtime: number; // seconds
        updatedBy: string;
        approvedBy?: string;
    };
}

// ========================================
// DATA MANAGEMENT EVENTS
// ========================================

export interface DataBackupStartedEvent extends BaseEvent {
    subject: Subjects.DataBackupStarted;
    data: {
        backupId: string;
        backupType: "FULL" | "INCREMENTAL" | "DIFFERENTIAL" | "SCHEMA_ONLY";
        description?: string;
        databases: string[];
        estimatedSize: number; // MB
        estimatedDuration: number; // minutes
        scheduledBackup: boolean;
        retentionPeriod: number; // days
        encryptionEnabled: boolean;
        compressionEnabled: boolean;
        backupLocation: {
            type: "LOCAL" | "CLOUD" | "REMOTE_SERVER";
            path: string;
        };
        initiatedBy: string;
        startedAt: string;
        priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
    };
}

export interface DataBackupCompletedEvent extends BaseEvent {
    subject: Subjects.DataBackupCompleted;
    data: {
        backupId: string;
        backupType: string;
        status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
        actualSize: number; // MB
        actualDuration: number; // minutes
        compressionRatio?: number;
        filePath?: string;
        cloudPath?: string;
        checksum: string;
        verificationStatus: "VERIFIED" | "FAILED" | "SKIPPED";
        completedAt: string;
        tablesBackedUp: number;
        recordsBackedUp: number;
        errorsEncountered?: string[];
        warningsIssued?: string[];
        nextIncrementalDue?: string;
        retentionApplied: boolean;
        oldBackupsDeleted?: number;
    };
}

export interface DataBackupFailedEvent extends BaseEvent {
    subject: Subjects.DataBackupFailed;
    data: {
        backupId: string;
        backupType: string;
        failureReason:
            | "DISK_SPACE"
            | "PERMISSIONS"
            | "DATABASE_LOCK"
            | "NETWORK_ERROR"
            | "TIMEOUT"
            | "CORRUPTION"
            | "OTHER";
        errorMessage: string;
        errorDetails?: any;
        partialBackupCreated: boolean;
        partialBackupSize?: number;
        tablesAffected?: string[];
        failedAt: string;
        duration: number; // minutes before failure
        retryScheduled: boolean;
        nextRetryAt?: string;
        maxRetriesReached?: boolean;
        alertLevel: "WARNING" | "CRITICAL";
        actionRequired: string[];
        administratorNotified: boolean;
    };
}

export interface DataRestoreStartedEvent extends BaseEvent {
    subject: Subjects.DataRestoreStarted;
    data: {
        restoreId: string;
        backupId: string;
        restoreType: "FULL" | "PARTIAL" | "POINT_IN_TIME" | "TABLE_SPECIFIC";
        targetDatabase?: string;
        targetTables?: string[];
        restorePoint?: string;
        estimatedDuration: number; // minutes
        dataValidationEnabled: boolean;
        backupIntegrityVerified: boolean;
        preRestoreBackupCreated: boolean;
        preRestoreBackupId?: string;
        initiatedBy: string;
        approvedBy?: string;
        startedAt: string;
        riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        businessImpact: string;
    };
}

export interface DataRestoreCompletedEvent extends BaseEvent {
    subject: Subjects.DataRestoreCompleted;
    data: {
        restoreId: string;
        backupId: string;
        status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
        actualDuration: number; // minutes
        recordsRestored: number;
        tablesRestored: string[];
        dataValidationResults: {
            recordCountMatch: boolean;
            checksumMatch: boolean;
            integrityCheckPassed: boolean;
            inconsistenciesFound?: number;
        };
        postRestoreChecks: Array<{
            checkName: string;
            status: "PASSED" | "FAILED";
            details?: string;
        }>;
        completedAt: string;
        applicationsRestarted: boolean;
        servicesAffected: string[];
        userAccessRestored: boolean;
        performanceImpact?: {
            queryResponseTime: number;
            systemLoad: number;
        };
    };
}

export interface DataExportedEvent extends BaseEvent {
    subject: Subjects.DataExported;
    data: {
        exportId: string;
        exportType: "CSV" | "EXCEL" | "JSON" | "XML" | "PDF" | "BACKUP";
        dataType:
            | "CUSTOMERS"
            | "PARTIES"
            | "SALES"
            | "INVOICES"
            | "PAYMENTS"
            | "REPORTS"
            | "ALL";
        format: string;
        recordCount: number;
        fileSize: number; // MB
        filePath?: string;
        downloadUrl?: string;
        encryptionApplied: boolean;
        passwordProtected: boolean;
        accessRestrictions: string[];
        requestedBy: string;
        approvedBy?: string;
        exportedAt: string;
        expiryDate?: string;
        auditTrailCreated: boolean;
        complianceLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
    };
}

export interface DataImportedEvent extends BaseEvent {
    subject: Subjects.DataImported;
    data: {
        importId: string;
        importType: "CSV" | "EXCEL" | "JSON" | "XML" | "BACKUP" | "MIGRATION";
        dataType:
            | "CUSTOMERS"
            | "PARTIES"
            | "PRODUCTS"
            | "TRANSACTIONS"
            | "CONFIGURATION";
        sourceFile: string;
        recordsProcessed: number;
        recordsSuccessful: number;
        recordsFailed: number;
        duplicatesHandled: number;
        validationErrors: Array<{
            row: number;
            field: string;
            error: string;
        }>;
        dataTransformationApplied: boolean;
        preImportBackupCreated: boolean;
        preImportBackupId?: string;
        importedBy: string;
        approvedBy?: string;
        importedAt: string;
        rollbackAvailable: boolean;
        postImportValidation: {
            recordCountMatch: boolean;
            dataIntegrityCheck: boolean;
            businessRulesValidation: boolean;
        };
    };
}

// ========================================
// CONFIGURATION EVENTS
// ========================================

export interface SettingsUpdatedEvent extends BaseEvent {
    subject: Subjects.SettingsUpdated;
    data: {
        settingKey: string;
        settingCategory:
            | "GENERAL"
            | "SECURITY"
            | "NOTIFICATION"
            | "PAYMENT"
            | "TAX"
            | "BUSINESS"
            | "INTEGRATION";
        oldValue: any;
        newValue: any;
        updatedBy: string;
        updatedAt: string;
        validationPassed: boolean;
        requiresRestart: boolean;
        affectedServices: string[];
        impactLevel: "MINIMAL" | "MODERATE" | "SIGNIFICANT";
        backupCreated: boolean;
        rollbackAvailable: boolean;
        auditReason?: string;
        approvalRequired: boolean;
        approvedBy?: string;
    };
}

export interface ConfigurationChangedEvent extends BaseEvent {
    subject: Subjects.ConfigurationChanged;
    data: {
        configType:
            | "APPLICATION"
            | "DATABASE"
            | "SECURITY"
            | "NETWORK"
            | "LOGGING"
            | "MONITORING";
        configFile?: string;
        changesApplied: Array<{
            section: string;
            parameter: string;
            oldValue: any;
            newValue: any;
        }>;
        changedBy: string;
        changedAt: string;
        validationStatus: "VALID" | "INVALID" | "WARNING";
        validationMessages?: string[];
        requiresRestart: boolean;
        restartScheduled: boolean;
        scheduledRestartTime?: string;
        backupConfigCreated: boolean;
        rollbackProcedure: string;
        environmentsAffected: string[];
        complianceImpact?: string;
    };
}

export interface BusinessProfileUpdatedEvent extends BaseEvent {
    subject: Subjects.BusinessProfileUpdated;
    data: {
        businessName: string;
        gstNumber?: string;
        panNumber?: string;
        address: string;
        phone: string;
        email?: string;
        website?: string;
        businessType?: string;
        incorporationDate?: string;
        financialYearStart?: string;
        defaultCurrency?: string;
        timezone?: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;
        updatedAt: string;
        verificationRequired: boolean;
        complianceNotificationSent?: boolean;
        documentsUpdated?: string[];
        regulatoryImpact?: string;
    };
}

export interface TaxSettingsUpdatedEvent extends BaseEvent {
    subject: Subjects.TaxSettingsUpdated;
    data: {
        taxType: "GST" | "VAT" | "SALES_TAX" | "SERVICE_TAX" | "INCOME_TAX";
        settings: {
            defaultTaxRate?: number;
            taxRegistrationNumber?: string;
            taxRegime?: string;
            exemptionCategories?: string[];
            applicableStates?: string[];
            effectiveFrom?: string;
        };
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;
        updatedAt: string;
        validationPassed: boolean;
        complianceCheck: boolean;
        retroactiveApplication: boolean;
        affectedTransactions?: number;
        recalculationRequired: boolean;
        governmentNotificationRequired?: boolean;
    };
}

export interface NotificationPreferencesUpdatedEvent extends BaseEvent {
    subject: Subjects.NotificationPreferencesUpdated;
    data: {
        userId?: string;
        globalSettings?: boolean;
        preferences: {
            emailNotifications?: {
                enabled: boolean;
                frequency: "IMMEDIATE" | "DAILY" | "WEEKLY";
                categories: string[];
            };
            smsNotifications?: {
                enabled: boolean;
                urgentOnly: boolean;
                categories: string[];
            };
            whatsappNotifications?: {
                enabled: boolean;
                businessHours: boolean;
                categories: string[];
            };
            pushNotifications?: {
                enabled: boolean;
                sound: boolean;
                categories: string[];
            };
        };
        updatedBy: string;
        updatedAt: string;
        testNotificationSent: boolean;
        validationPassed: boolean;
        affectedNotificationTypes: string[];
    };
}

// ========================================
// AUDIT & COMPLIANCE EVENTS
// ========================================

export interface AuditLogCreatedEvent extends BaseEvent {
    subject: Subjects.AuditLogCreated;
    data: {
        id: string;
        userId?: string;
        userName?: string;
        action: string;
        entity: string;
        entityId: string;
        oldData?: any;
        newData?: any;
        changeDescription?: string;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
        requestId?: string;
        endpoint?: string;
        httpMethod?: string;
        statusCode?: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        complianceRelevant: boolean;
        retentionPeriod: number; // years
        encryptionLevel: "NONE" | "STANDARD" | "HIGH" | "CLASSIFIED";
        createdAt: string;
        additionalMetadata?: Record<string, any>;
    };
}

export interface ComplianceCheckPerformedEvent extends BaseEvent {
    subject: Subjects.ComplianceCheckPerformed;
    data: {
        checkId: string;
        checkType:
            | "GDPR"
            | "SOX"
            | "PCI_DSS"
            | "ISO27001"
            | "HIPAA"
            | "LOCAL_REGULATION"
            | "BUSINESS_RULE";
        entity: string;
        entityId: string;
        checkResult:
            | "COMPLIANT"
            | "NON_COMPLIANT"
            | "PARTIALLY_COMPLIANT"
            | "REQUIRES_REVIEW";
        score?: number; // 0-100
        violations: Array<{
            rule: string;
            severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
            description: string;
            remediation: string;
        }>;
        recommendations: string[];
        checkedAt: string;
        checkedBy?: string;
        automated: boolean;
        previousCheckDate?: string;
        improvementSinceLastCheck?: number;
        nextCheckDue?: string;
        reportGenerated: boolean;
        actionItemsCreated: number;
    };
}

export interface DataIntegrityCheckPerformedEvent extends BaseEvent {
    subject: Subjects.DataIntegrityCheckPerformed;
    data: {
        checkId: string;
        checkType:
            | "REFERENTIAL_INTEGRITY"
            | "BUSINESS_RULES"
            | "DATA_CONSISTENCY"
            | "CHECKSUM_VALIDATION"
            | "DUPLICATE_DETECTION";
        tablesChecked: string[];
        recordsValidated: number;
        issuesFound: Array<{
            table: string;
            issueType: string;
            recordId?: string;
            description: string;
            severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
            autoFixable: boolean;
        }>;
        checksumValidation: {
            expected: string;
            actual: string;
            match: boolean;
        };
        overallStatus:
            | "HEALTHY"
            | "MINOR_ISSUES"
            | "MAJOR_ISSUES"
            | "CRITICAL_ISSUES";
        autoFixAttempted: boolean;
        issuesAutoFixed: number;
        manualInterventionRequired: number;
        checkedAt: string;
        duration: number; // minutes
        performanceImpact: "MINIMAL" | "MODERATE" | "HIGH";
        reportGenerated: boolean;
    };
}

export interface SecurityScanPerformedEvent extends BaseEvent {
    subject: Subjects.SecurityScanPerformed;
    data: {
        scanId: string;
        scanType:
            | "VULNERABILITY"
            | "PENETRATION"
            | "COMPLIANCE"
            | "MALWARE"
            | "ACCESS_REVIEW"
            | "CONFIGURATION_AUDIT";
        scope:
            | "FULL_SYSTEM"
            | "WEB_APPLICATION"
            | "DATABASE"
            | "NETWORK"
            | "USER_ACCESS"
            | "SPECIFIC_COMPONENT";
        targetComponent?: string;
        scanResult:
            | "SECURE"
            | "MINOR_VULNERABILITIES"
            | "MAJOR_VULNERABILITIES"
            | "CRITICAL_VULNERABILITIES";
        vulnerabilities: Array<{
            id: string;
            severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
            category: string;
            description: string;
            affectedComponent: string;
            cveId?: string;
            remediation: string;
            estimatedFixTime: number; // hours
        }>;
        overallScore: number; // 0-100
        complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "PARTIALLY_COMPLIANT";
        scannerTool: string;
        scannerVersion: string;
        scannedAt: string;
        duration: number; // minutes
        falsePositives: number;
        suppressedFindings: number;
        newVulnerabilities: number;
        fixedSinceLastScan: number;
        reportGenerated: boolean;
        remediationPlanCreated: boolean;
        criticalIssuesEscalated: boolean;
    };
}

// ========================================
// MONITORING & ALERTING EVENTS
// ========================================

export interface SystemMetricsCollectedEvent extends BaseEvent {
    subject: Subjects.SystemMetricsCollected;
    data: {
        serviceName: string;
        collectionTime: string;
        metricsInterval: number; // seconds
        systemMetrics: {
            cpu: {
                usage: number; // percentage
                load1m: number;
                load5m: number;
                load15m: number;
            };
            memory: {
                totalMB: number;
                usedMB: number;
                freeMB: number;
                usagePercentage: number;
                swapUsedMB?: number;
            };
            disk: {
                totalGB: number;
                usedGB: number;
                freeGB: number;
                usagePercentage: number;
                ioWaitTime?: number;
            };
            network: {
                bytesInPerSec: number;
                bytesOutPerSec: number;
                packetsInPerSec: number;
                packetsOutPerSec: number;
                errorRate: number;
            };
        };
        applicationMetrics: {
            activeConnections: number;
            requestsPerSecond: number;
            averageResponseTime: number; // milliseconds
            errorRate: number; // percentage
            queueDepth: number;
            cacheHitRate?: number; // percentage
        };
        databaseMetrics?: {
            connectionPoolSize: number;
            activeConnections: number;
            avgQueryTime: number; // milliseconds
            slowQueries: number;
            lockWaitTime: number; // milliseconds
        };
        alertsTriggered: string[];
        performanceGrade: "A" | "B" | "C" | "D" | "F";
    };
}

export interface SystemAlertTriggeredEvent extends BaseEvent {
    subject: Subjects.SystemAlertTriggered;
    data: {
        alertId: string;
        alertType:
            | "PERFORMANCE"
            | "SECURITY"
            | "ERROR_RATE"
            | "RESOURCE_USAGE"
            | "BUSINESS_RULE"
            | "CUSTOM";
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        title: string;
        description: string;
        affectedService: string;
        affectedComponent?: string;
        metricName: string;
        currentValue: number;
        thresholdValue: number;
        comparisonOperator: ">" | "<" | "=" | "!=" | ">=" | "<=";
        triggeredAt: string;
        duration?: number; // seconds since threshold breach
        previousAlertTime?: string;
        escalationLevel: number;
        autoResolution: boolean;
        resolutionActions: string[];
        notificationChannels: string[];
        acknowledgmentRequired: boolean;
        acknowledgedBy?: string;
        acknowledgedAt?: string;
        resolved: boolean;
        resolvedAt?: string;
        rootCause?: string;
        businessImpact:
            | "NONE"
            | "MINIMAL"
            | "MODERATE"
            | "SIGNIFICANT"
            | "CRITICAL";
    };
}

// ========================================
// INTEGRATION & API EVENTS
// ========================================

export interface APIEndpointAccessedEvent extends BaseEvent {
    subject: Subjects.APIEndpointAccessed;
    data: {
        requestId: string;
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
        clientId?: string;
        apiKey?: string; // masked
        userId?: string;
        ipAddress: string;
        userAgent?: string;
        requestSize: number; // bytes
        responseSize: number; // bytes
        responseTime: number; // milliseconds
        statusCode: number;
        success: boolean;
        errorType?: string;
        errorMessage?: string;
        rateLimit: {
            limit: number;
            remaining: number;
            resetTime: string;
        };
        quotaUsage?: {
            daily: number;
            monthly: number;
        };
        accessedAt: string;
        businessContext?: string;
        sensitiveDataAccessed?: boolean;
        complianceLogged: boolean;
    };
}

// export interface ThirdPartyAPICallEvent extends BaseEvent {
//     subject: Subjects.ThirdPartyAPICall;
//     data: {
//         callId: string;
//         apiProvider: string;
//         endpoint: string;
//         method: string;
//         purpose:
//             | "PAYMENT_PROCESSING"
//             | "SMS_GATEWAY"
//             | "EMAIL_SERVICE"
//             | "DATA_VALIDATION"
//             | "BACKUP_SERVICE"
//             | "OTHER";
//         requestData?: any; // sanitized
//         responseData?: any; // sanitized
//         success: boolean;
//         statusCode?: number;
//         responseTime: number; // milliseconds
//         retryAttempt: number;
//         maxRetries: number;
//         errorType?: string;
//         errorMessage?: string;
//         apiKeyUsed?: string; // masked
//         costIncurred?: number;
//         quotaConsumed?: number;
//         calledAt: string;
//         calledBy: string;
//         businessImpact?: string;
//         fallbackUsed?: boolean;
//         cacheHit?: boolean;
//     };
// }

export interface WebhookReceivedEvent extends BaseEvent {
    subject: Subjects.WebhookReceived;
    data: {
        webhookId: string;
        source: string;
        eventType: string;
        payload: any;
        headers: Record<string, string>;
        signature?: string;
        signatureVerified: boolean;
        ipAddress: string;
        receivedAt: string;
        processedAt?: string;
        processingStatus:
            | "RECEIVED"
            | "VALIDATED"
            | "PROCESSED"
            | "FAILED"
            | "REJECTED";
        validationErrors?: string[];
        processingErrors?: string[];
        retryCount: number;
        maxRetries: number;
        businessEntity?: string;
        businessEntityId?: string;
        actionTaken?: string;
        responseStatusCode: number;
        responseBody?: any;
        duplicateRequest: boolean;
        securityRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    };
}

// ========================================
// PERFORMANCE & OPTIMIZATION EVENTS
// ========================================

// export interface PerformanceOptimizationEvent extends BaseEvent {
//     subject: Subjects.PerformanceOptimization;
//     data: {
//         optimizationId: string;
//         optimizationType:
//             | "DATABASE_QUERY"
//             | "INDEX_CREATION"
//             | "CACHE_STRATEGY"
//             | "RESOURCE_ALLOCATION"
//             | "CODE_OPTIMIZATION";
//         targetComponent: string;
//         performanceBefore: {
//             responseTime: number; // milliseconds
//             throughput: number; // requests/second
//             resourceUsage: number; // percentage
//             errorRate: number; // percentage
//         };
//         performanceAfter: {
//             responseTime: number;
//             throughput: number;
//             resourceUsage: number;
//             errorRate: number;
//         };
//         improvement: {
//             responseTimeReduction: number; // percentage
//             throughputIncrease: number; // percentage
//             resourceSavings: number; // percentage
//             errorReduction: number; // percentage
//         };
//         optimizationActions: string[];
//         implementedAt: string;
//         implementedBy: string;
//         rollbackAvailable: boolean;
//         monitoringPeriod: number; // days
//         successCriteria: string[];
//         businessImpact: string;
//         costSavings?: number;
//         userExperienceImprovement:
//             | "NONE"
//             | "MINIMAL"
//             | "MODERATE"
//             | "SIGNIFICANT"
//             | "SUBSTANTIAL";
//     };
// }

// export interface CacheOperationEvent extends BaseEvent {
//     subject: Subjects.CacheOperation;
//     data: {
//         operation: "HIT" | "MISS" | "SET" | "DELETE" | "CLEAR" | "EVICTION";
//         cacheType: "MEMORY" | "REDIS" | "DATABASE" | "CDN" | "APPLICATION";
//         key: string; // sanitized
//         cacheLevel: "L1" | "L2" | "L3";
//         dataSize?: number; // bytes
//         ttl?: number; // seconds
//         hitRate?: number; // percentage
//         missRate?: number; // percentage
//         evictionReason?:
//             | "TTL_EXPIRED"
//             | "MEMORY_PRESSURE"
//             | "MANUAL"
//             | "CACHE_FULL";
//         responseTime: number; // microseconds
//         operationAt: string;
//         requestedBy?: string;
//         businessContext?: string;
//         cacheEfficiency: number; // percentage
//         memoryUsage?: number; // MB
//         compressionRatio?: number;
//     };
// }

// ========================================
// LICENSING & SUBSCRIPTION EVENTS
// ========================================

// export interface LicenseValidationEvent extends BaseEvent {
//     subject: Subjects.LicenseValidation;
//     data: {
//         licenseKey: string; // masked
//         productName: string;
//         licenseType:
//             | "TRIAL"
//             | "BASIC"
//             | "PROFESSIONAL"
//             | "ENTERPRISE"
//             | "CUSTOM";
//         validationResult:
//             | "VALID"
//             | "INVALID"
//             | "EXPIRED"
//             | "SUSPENDED"
//             | "EXCEEDED_LIMITS";
//         expiryDate?: string;
//         usageLimits: {
//             maxUsers?: number;
//             currentUsers?: number;
//             maxTransactions?: number;
//             currentTransactions?: number;
//             maxStorage?: number; // GB
//             currentStorage?: number; // GB
//         };
//         features: {
//             enabledFeatures: string[];
//             disabledFeatures: string[];
//             upcomingFeatures?: string[];
//         };
//         validatedAt: string;
//         validatedBy?: string;
//         gracePeriod?: number; // days
//         renewalRequired: boolean;
//         renewalUrl?: string;
//         contactRequired: boolean;
//         complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "GRACE_PERIOD";
//     };
// }

// ========================================
// EXPORT ALL SYSTEM EVENT TYPES
// ========================================

export type SystemEventTypes =
    | SystemStartedEvent
    | SystemShutdownEvent
    | SystemHealthCheckPerformedEvent
    | SystemMaintenanceStartedEvent
    | SystemMaintenanceCompletedEvent
    | SystemUpdatedEvent
    | DataBackupStartedEvent
    | DataBackupCompletedEvent
    | DataBackupFailedEvent
    | DataRestoreStartedEvent
    | DataRestoreCompletedEvent
    | DataExportedEvent
    | DataImportedEvent
    | SettingsUpdatedEvent
    | ConfigurationChangedEvent
    | BusinessProfileUpdatedEvent
    | TaxSettingsUpdatedEvent
    | NotificationPreferencesUpdatedEvent
    | AuditLogCreatedEvent
    | ComplianceCheckPerformedEvent
    | DataIntegrityCheckPerformedEvent
    | SecurityScanPerformedEvent
    | SystemMetricsCollectedEvent
    | SystemAlertTriggeredEvent
    | APIEndpointAccessedEvent
    | WebhookReceivedEvent;
// | ThirdPartyAPICallEvent
// | PerformanceOptimizationEvent
// | CacheOperationEvent
// | LicenseValidationEvent;
