// packages/common-backend/src/utils/multer.ts
import multer from "multer";
import path from "path";
import { Request } from "express";
import { CustomError } from "../utils/index";

// Storage configuration
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || "uploads";
        cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// File filter
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new CustomError(400, "Only JPEG, PNG and PDF files are allowed"));
    }
};

// Multer configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Maximum 5 files
    },
});

// Upload middlewares
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
    upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
    upload.fields(fields);
