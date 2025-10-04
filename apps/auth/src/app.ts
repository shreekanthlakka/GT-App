import express from "express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import ecommAuthRoutes from "./routes/ecommAuthRoutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).send("Auth Server is alive").json({
        status: "healthy",
        service: "auth-service",
        timestamp: new Date().toISOString(),
    });
});

// ==============================================
//                   ROUTES
// ==============================================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/ecommerce/auth", ecommAuthRoutes);

// ==============================================
// ==============================================

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
    });
});

export default app;
