// apps/ocr/src/app.ts
import express from "express";
import compression from "compression";
import ocrRoutes from "./routes/ocrRoutes";

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware

// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "ocr-service",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use((req, res, next) => {
    console.log(
        `${req.ip} ===> ${req.method} ===> ${req.url} ==> ${new Date()}`
    );
    next();
});

// ========================================
// ROUTES
// ========================================

app.use("/api/v1/ocr", ocrRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
        path: req.originalUrl,
    });
});

// ========================================
// ERROR HANDLER
// ========================================

export default app;
