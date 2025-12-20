import express from "express";
import dashboardRoutes from "./routes/dashboardRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import templateRoutes from "./routes/templateRoutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).send("Notification Server is alive").json({
        status: "healthy",
        service: "notification-service",
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res, next) => {
    console.log(
        `${req.ip} ===> ${req.method} ===> ${req.url} ==> ${new Date()}`
    );
    next();
});

// ==============================================
//                   ROUTES
// ==============================================

console.log("Registering dashboardRoutes...");
app.use("/api/v1/dashboard", dashboardRoutes);
console.log("Registering notificationRoutes...");
app.use("/api/v1/notification", notificationRoutes);
console.log("Registering templateRoutes...");
app.use("/api/v1/template", templateRoutes);

app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
    });
});

export default app;
