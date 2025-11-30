import express from "express";
import customerRoutes from "./routes/customerRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import invoicePaymentRoutes from "./routes/invoicePaymentRoutes";
import partyRoutes from "./routes/partyRoutes";
import saleRoutes from "./routes/saleRoutes";
import saleReciptRoutes from "./routes/saleReceiptRoutes";
import financialReportRoutes from "./routes/financialReportsRoutes";

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

app.use((req, res, next) => {
    console.log(
        `${req.ip} ===> ${req.method} ===> ${req.url} ==> ${new Date()}`
    );
    next();
});

// ==============================================
//                   ROUTES
// ==============================================

app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/parties", partyRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/invoice-payments", invoicePaymentRoutes);
app.use("/api/v1/inventories", inventoryRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/sale-receipts", saleReciptRoutes);
app.use("/api/v1/financial-reports", financialReportRoutes);

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
    });
});

export default app;
