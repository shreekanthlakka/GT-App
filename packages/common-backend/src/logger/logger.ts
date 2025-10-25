import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Log levels
export enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    DEBUG = "debug",
}

// Log categories for better organization
export enum LogCategory {
    AUTH = "AUTH",
    CUSTOMER = "CUSTOMER",
    PARTY = "PARTY",
    PRODUCT = "PRODUCT",
    SALE = "SALE",
    INVOICE = "INVOICE",
    PAYMENT = "PAYMENT",
    ORDER = "ORDER",
    INVENTORY = "INVENTORY",
    NOTIFICATION = "NOTIFICATION",
    OCR = "OCR",
    LEDGER = "LEDGER",
    SYSTEM = "SYSTEM",
    SECURITY = "SECURITY",
    DATABASE = "DATABASE",
    KAFKA = "KAFKA",
    API = "API",
    BUSINESS = "BUSINESS",
    ACCOUNTS = "ACCOUNTS",
    ECOMMERCE = "ECOMMERCE",
}

// Log context interface
export interface LogContext {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    entityId?: string;
    entityType?: string;
    action?: string;
    serviceName?: string;
    version?: string;
    environment?: string;
    [key: string]: any;
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info) => {
        const { timestamp, level, message, category, context, stack, ...meta } =
            info;

        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            category: category || LogCategory.SYSTEM,
            message,
            service: process.env.SERVICE_NAME || "unknown",
            environment: process.env.NODE_ENV || "development",
            ...(context ? { context } : {}),
            ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
            ...(stack ? { stack } : {}),
        };

        return JSON.stringify(logEntry);
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.colorize(),
    winston.format.printf((info) => {
        const { timestamp, level, message, category, context } = info;
        const categoryStr = category ? `[${category}]` : "";
        const contextStr = context ? JSON.stringify(context) : "";
        return `${timestamp} ${level} ${categoryStr} ${message} ${contextStr}`;
    })
);

// Create transports
const createTransports = () => {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV === "development") {
        transports.push(
            new winston.transports.Console({
                format: consoleFormat,
                level: "debug",
            })
        );
    }

    // File transports
    const logDir = process.env.LOG_DIR || "logs";

    // Error logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, "error-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            level: "error",
            format: logFormat,
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
        })
    );

    // Combined logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, "combined-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            format: logFormat,
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
        })
    );

    // HTTP access logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, "access-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            level: "http",
            format: logFormat,
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
        })
    );

    // Audit logs (for compliance)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, "audit-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            format: logFormat,
            maxSize: "20m",
            maxFiles: "365d", // Keep audit logs for 1 year
            zippedArchive: true,
        })
    );

    return transports;
};

// Create Winston logger instance
const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: logFormat,
    transports: createTransports(),
    exitOnError: false,
});

// Logger class with business-specific methods
class Logger {
    private static instance: Logger;
    private winston: winston.Logger;

    private constructor() {
        this.winston = winstonLogger;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /** Merge base context with optional context safely */
    private withContext(base: object, context?: LogContext) {
        return { ...base, ...(context ?? {}) };
    }

    // Generic logging methods
    public log(
        level: LogLevel,
        message: string,
        category?: LogCategory,
        context?: LogContext
    ): void {
        this.winston.log(level, message, { category, context });
    }

    public error(
        message: string,
        error?: Error,
        category?: LogCategory,
        context?: LogContext
    ): void {
        this.winston.error(message, {
            category: category || LogCategory.SYSTEM,
            context,
            stack: error?.stack,
            errorMessage: error?.message,
        });
    }

    public warn(
        message: string,
        category?: LogCategory,
        context?: LogContext
    ): void {
        this.winston.warn(message, {
            category: category || LogCategory.SYSTEM,
            context,
        });
    }

    public info(
        message: string,
        category?: LogCategory,
        context?: LogContext
    ): void {
        this.winston.info(message, {
            category: category || LogCategory.SYSTEM,
            context,
        });
    }

    public debug(
        message: string,
        category?: LogCategory,
        context?: LogContext
    ): void {
        this.winston.debug(message, {
            category: category || LogCategory.SYSTEM,
            context,
        });
    }

    public http(message: string, context?: LogContext): void {
        this.winston.http(message, { category: LogCategory.API, context });
    }

    // Business-specific logging methods
    public logAuth(
        action: string,
        userId?: string,
        context?: LogContext
    ): void {
        this.info(
            `Auth: ${action}`,
            LogCategory.AUTH,
            this.withContext({ userId }, context)
        );
    }

    public logSale(
        action: string,
        saleId: string,
        customerId: string,
        amount: number,
        context?: LogContext
    ): void {
        this.info(
            `Sale: ${action}`,
            LogCategory.SALE,
            this.withContext(
                {
                    saleId,
                    customerId,
                    amount,
                },
                context
            )
        );
    }

    public logPayment(
        action: string,
        paymentId: string,
        amount: number,
        method: string,
        context?: LogContext
    ): void {
        this.info(
            `Payment: ${action}`,
            LogCategory.PAYMENT,
            this.withContext(
                {
                    paymentId,
                    amount,
                    method,
                },
                context
            )
        );
    }

    // Audit logging for compliance
    public audit(
        action: string,
        entityType: string,
        entityId: string,
        userId?: string,
        oldData?: any,
        newData?: any,
        context?: LogContext
    ): void {
        this.winston.log("info", `Audit: ${action}`, {
            category: "AUDIT",
            context: this.withContext(
                {
                    entityType,
                    entityId,
                    userId,
                    oldData,
                    newData,
                    timestamp: new Date().toISOString(),
                },
                context
            ),
        });
    }
}

// Export singleton instance
export const logger = Logger.getInstance();
