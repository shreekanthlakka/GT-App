import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).send("Accounts Server is alive").json({
        status: "healthy",
        service: "accounts-service",
        timestamp: new Date().toISOString(),
    });
});

// ==============================================
//                   ROUTES
// ==============================================

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
    });
});

export default app;
