import crypto from "crypto";
import * as base32 from "hi-base32";

/**
 * Generate a secure random verification token
 * @param length - Length of the token (default: 32 bytes = 64 hex characters)
 * @returns Hex-encoded random token
 */
export const generateVerificationToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate a 6-digit OTP for phone/email verification
 * @returns 6-digit numeric OTP as string
 */
export const generateOTP = (): string => {
    // Generate a random number between 100000 and 999999
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

/**
 * Generate a more secure OTP using crypto.randomInt
 * @param digits - Number of digits (default: 6)
 * @returns Numeric OTP as string
 */
export const generateSecureOTP = (digits: number = 6): string => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;

    const otp = crypto.randomInt(min, max + 1);
    return otp.toString().padStart(digits, "0");
};

/**
 * Generate a cryptographically secure random string
 * @param length - Length of the string
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 */
export const generateSecureRandomString = (
    length: number = 16,
    charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
): string => {
    let result = "";
    const charsetLength = charset.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charsetLength);
        result += charset[randomIndex];
    }

    return result;
};

/**
 * Generate a URL-safe token
 * @param length - Length in bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export const generateURLSafeToken = (length: number = 32): string => {
    return crypto
        .randomBytes(length)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};

/**
 * Generate a referral code
 * @param prefix - Prefix for the code (e.g., user initials)
 * @param length - Length of the random part (default: 6)
 * @returns Referral code
 */
export const generateReferralCode = (
    prefix: string = "",
    length: number = 6
): string => {
    const randomPart = generateSecureRandomString(
        length,
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    );
    return prefix ? `${prefix.toUpperCase()}${randomPart}` : randomPart;
};

/**
 * Generate a session ID
 * @returns Session ID string
 */
export const generateSessionId = (): string => {
    return `sess_${generateVerificationToken(16)}`;
};

/**
 * Generate a secure API key
 * @param prefix - Prefix for the key (e.g., 'sk_', 'pk_')
 * @returns API key
 */
export const generateAPIKey = (prefix: string = "sk_"): string => {
    const randomPart = generateSecureRandomString(32);
    return `${prefix}${randomPart}`;
};

/**
 * Generate a hash of a string using SHA-256
 * @param input - Input string to hash
 * @returns SHA-256 hash in hex format
 */
export const generateHash = (input: string): string => {
    return crypto.createHash("sha256").update(input).digest("hex");
};

/**
 * Generate HMAC signature
 * @param data - Data to sign
 * @param secret - Secret key
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns HMAC signature in hex format
 */
export const generateHMAC = (
    data: string,
    secret: string,
    algorithm: string = "sha256"
): string => {
    return crypto.createHmac(algorithm, secret).update(data).digest("hex");
};

/**
 * Verify HMAC signature
 * @param data - Original data
 * @param signature - Signature to verify
 * @param secret - Secret key
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns True if signature is valid
 */
export const verifyHMAC = (
    data: string,
    signature: string,
    secret: string,
    algorithm: string = "sha256"
): boolean => {
    const expectedSignature = generateHMAC(data, secret, algorithm);
    return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
    );
};

/**
 * Generate a time-based OTP (TOTP) - simplified version
 * @param secret - Shared secret
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits (default: 6)
 * @returns TOTP code
 */
export const generateTOTP = (
    secret: string,
    timeStep: number = 30,
    digits: number = 6
): string => {
    const epoch = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(epoch / timeStep);

    const key = base32.decode(secret);

    const hmac = crypto.createHmac("sha1", key);
    // const hmac = crypto.createHmac("sha1", Buffer.from(secret, "base32"));
    hmac.update(Buffer.from(timeCounter.toString(16).padStart(16, "0"), "hex"));

    const digest = hmac.digest();
    const offset = digest[digest.length - 1]! & 0xf;
    const code =
        ((digest[offset]! & 0x7f) << 24) |
        ((digest[offset + 1]! & 0xff) << 16) |
        ((digest[offset + 2]! & 0xff) << 8) |
        (digest[offset + 3]! & 0xff);

    const otp = (code % Math.pow(10, digits)).toString();
    return otp.padStart(digits, "0");
};

/**
 * Generate a random UUID v4
 * @returns UUID v4 string
 */
export const generateUUID = (): string => {
    return crypto.randomUUID();
};

/**
 * Mask sensitive data for logging
 * @param data - Data to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked string
 */
export const maskSensitiveData = (
    data: string,
    visibleChars: number = 4
): string => {
    if (data.length <= visibleChars * 2) {
        return "*".repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = "*".repeat(data.length - visibleChars * 2);

    return `${start}${middle}${end}`;
};

/**
 * Generate a token with expiry information
 * @param length - Token length in bytes
 * @param expiresInMinutes - Expiry time in minutes
 * @returns Object with token and expiry date
 */
export const generateTokenWithExpiry = (
    length: number = 32,
    expiresInMinutes: number = 60
) => {
    const token = generateVerificationToken(length);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    return {
        token,
        expiresAt,
        expiresIn: `${expiresInMinutes} minutes`,
    };
};

/**
 * Generate a secure filename for uploaded files
 * @param originalName - Original filename
 * @param preserveExtension - Whether to preserve file extension
 * @returns Secure filename
 */
export const generateSecureFilename = (
    originalName: string,
    preserveExtension: boolean = true
): string => {
    const timestamp = Date.now();
    const randomPart = generateSecureRandomString(8);

    if (preserveExtension) {
        const extension = originalName.split(".").pop();
        return `${timestamp}_${randomPart}.${extension}`;
    }

    return `${timestamp}_${randomPart}`;
};

/**
 * Constants for common token/OTP configurations
 */
export const TokenConfig = {
    EMAIL_VERIFICATION: {
        length: 32,
        expiresInMinutes: 24 * 60, // 24 hours
    },
    PASSWORD_RESET: {
        length: 32,
        expiresInMinutes: 60, // 1 hour
    },
    PHONE_OTP: {
        digits: 6,
        expiresInMinutes: 10, // 10 minutes
    },
    SESSION_TOKEN: {
        length: 32,
        expiresInHours: 24, // 24 hours
    },
    REFRESH_TOKEN: {
        length: 48,
        expiresInDays: 30, // 30 days
    },
    API_KEY: {
        length: 32,
        prefix: "sk_live_",
    },
} as const;

/**
 * Utility functions for common token operations
 */
export const TokenUtils = {
    /**
     * Generate email verification token
     */
    emailVerification: () =>
        generateTokenWithExpiry(
            TokenConfig.EMAIL_VERIFICATION.length,
            TokenConfig.EMAIL_VERIFICATION.expiresInMinutes
        ),

    /**
     * Generate password reset token
     */
    passwordReset: () =>
        generateTokenWithExpiry(
            TokenConfig.PASSWORD_RESET.length,
            TokenConfig.PASSWORD_RESET.expiresInMinutes
        ),

    /**
     * Generate phone OTP
     */
    phoneOTP: () => ({
        otp: generateSecureOTP(TokenConfig.PHONE_OTP.digits),
        expiresAt: new Date(
            Date.now() + TokenConfig.PHONE_OTP.expiresInMinutes * 60 * 1000
        ),
        expiresIn: `${TokenConfig.PHONE_OTP.expiresInMinutes} minutes`,
    }),

    /**
     * Generate session tokens
     */
    session: () => ({
        sessionToken: generateVerificationToken(
            TokenConfig.SESSION_TOKEN.length
        ),
        refreshToken: generateVerificationToken(
            TokenConfig.REFRESH_TOKEN.length
        ),
        sessionExpiresAt: new Date(
            Date.now() +
                TokenConfig.SESSION_TOKEN.expiresInHours * 60 * 60 * 1000
        ),
        refreshExpiresAt: new Date(
            Date.now() +
                TokenConfig.REFRESH_TOKEN.expiresInDays * 24 * 60 * 60 * 1000
        ),
    }),
};
