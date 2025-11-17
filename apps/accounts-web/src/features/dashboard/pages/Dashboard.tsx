import { Card, CardContent } from "@repo/ui";
import {
    Users,
    Building2,
    FileText,
    ShoppingCart,
    DollarSign,
    TrendingUp,
} from "lucide-react";

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to GangadharaTextiles Management System
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Parties
                                </p>
                                <p className="text-2xl font-bold mt-2">24</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-green-600">+2</span>{" "}
                                    from last month
                                </p>
                            </div>
                            <Building2 className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Customers
                                </p>
                                <p className="text-2xl font-bold mt-2">156</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-green-600">+12</span>{" "}
                                    from last month
                                </p>
                            </div>
                            <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Invoices
                                </p>
                                <p className="text-2xl font-bold mt-2">342</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-green-600">+28</span>{" "}
                                    from last month
                                </p>
                            </div>
                            <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Sales
                                </p>
                                <p className="text-2xl font-bold mt-2">
                                    ₹12.5L
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-green-600">+15%</span>{" "}
                                    from last month
                                </p>
                            </div>
                            <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Card */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Revenue
                                </p>
                                <p className="text-3xl font-bold mt-2">
                                    ₹45,23,450
                                </p>
                            </div>
                            <DollarSign className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="flex items-center text-sm">
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-green-600 font-medium">
                                +12.5%
                            </span>
                            <span className="text-muted-foreground ml-2">
                                vs last month
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Pending Payments
                                </p>
                                <p className="text-3xl font-bold mt-2">
                                    ₹8,45,230
                                </p>
                            </div>
                            <FileText className="h-10 w-10 text-orange-600" />
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <span>12 invoices pending</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                            <Building2 className="h-6 w-6 mb-2 text-primary" />
                            <p className="font-medium">Add Party</p>
                            <p className="text-xs text-muted-foreground">
                                Create new supplier
                            </p>
                        </button>
                        <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                            <FileText className="h-6 w-6 mb-2 text-primary" />
                            <p className="font-medium">New Invoice</p>
                            <p className="text-xs text-muted-foreground">
                                Create purchase invoice
                            </p>
                        </button>
                        <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                            <ShoppingCart className="h-6 w-6 mb-2 text-primary" />
                            <p className="font-medium">New Sale</p>
                            <p className="text-xs text-muted-foreground">
                                Record new sale
                            </p>
                        </button>
                        <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                            <Users className="h-6 w-6 mb-2 text-primary" />
                            <p className="font-medium">Add Customer</p>
                            <p className="text-xs text-muted-foreground">
                                Create new customer
                            </p>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    New party added
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ABC Textiles - 2 hours ago
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    Invoice created
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    INV-2025-001 - 3 hours ago
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    Payment received
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ₹50,000 from XYZ Traders - 5 hours ago
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
