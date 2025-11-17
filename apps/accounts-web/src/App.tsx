import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import LoginPage from "./features/auth/pages/LoginPage";
import EditCustomerPage from "./features/customers/pages/EditCustomerPage";
import { InvoicesPage } from "./features/invoices/pages/InvoicesPage";
import { InvoiceDetailPage } from "./features/invoices/pages/InvoiceDetailPage";
import { CreateInvoicePage } from "./features/invoices/pages/CreateInvoicePage";
import { SalesPage } from "./features/sales/pages/SalesPage";
import { CreateSalePage } from "./features/sales/pages/CreateSalePage";
import { SaleDetailPage } from "./features/sales/pages/SaleDetailPage";

const CustomerDetailPage = lazy(
    () => import("./features/customers/pages/CustomerDetailPage")
);
const EditPartyPage = lazy(
    () => import("./features/parties/pages/EditPartyPage")
);
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const PartiesPage = lazy(() => import("./features/parties/pages/PartiesPage"));

const CreatePartyPage = lazy(
    () => import("./features/parties/pages/CreatePartyPage")
);
const PartyDetailPage = lazy(
    () => import("./features/parties/pages/PartyDetailPage")
);

const CustomersPage = lazy(
    () => import("./features/customers/pages/CustomersPage")
);
const CreateCustomerPage = lazy(
    () => import("./features/customers/pages/CreateCustomerPage")
);

// Loading component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
    </div>
);

function App() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Parties */}
                    <Route path="parties" element={<PartiesPage />} />
                    <Route path="parties/new" element={<CreatePartyPage />} />
                    <Route path="parties/:id" element={<PartyDetailPage />} />
                    <Route
                        path="parties/:id/edit"
                        element={<EditPartyPage />}
                    />

                    {/* customer  */}
                    <Route path="customers" element={<CustomersPage />} />
                    <Route
                        path="customers/new"
                        element={<CreateCustomerPage />}
                    />
                    <Route
                        path="customers/:id"
                        element={<CustomerDetailPage />}
                    />
                    <Route
                        path="customers/:id/edit"
                        element={<EditCustomerPage />}
                    />
                    {/* invoices */}
                    <Route path="invoices" element={<InvoicesPage />} />
                    <Route
                        path="invoices/new"
                        element={<CreateInvoicePage />}
                    />
                    <Route
                        path="invoices/:id"
                        element={<InvoiceDetailPage />}
                    />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="sales/new" element={<CreateSalePage />} />
                    <Route path="sales/:id" element={<SaleDetailPage />} />

                    <Route
                        path="inventory"
                        element={
                            <div className="text-center py-12">Inventory</div>
                        }
                    />
                    <Route
                        path="ocr/upload"
                        element={<div className="text-center py-12">OCR</div>}
                    />
                    <Route
                        path="settings"
                        element={
                            <div className="text-center py-12">settings</div>
                        }
                    />
                </Route>

                {/* 404 */}
                <Route
                    path="*"
                    element={
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="text-center">
                                <h1 className="text-6xl font-bold">404</h1>
                                <p className="text-xl text-muted-foreground mt-4">
                                    Page not found
                                </p>
                                <a
                                    href="/"
                                    className="text-primary mt-4 inline-block"
                                >
                                    Go back home
                                </a>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </Suspense>
    );
}

export default App;
