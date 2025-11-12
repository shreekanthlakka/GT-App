// apps/accounts-web/src/features/invoice-payments/pages/PaymentAnalyticsPage.tsx

import { useState } from "react";
import {
    usePaymentAnalytics,
    usePaymentSummary,
} from "../hooks/use-invoice-payments";
import { Card, Skeleton } from "@repo/ui";
import { BarChart, DollarSign, TrendingUp, CreditCard } from "lucide-react";

export const PaymentAnalyticsPage = () => {
    const [dateRange] = useState({
        startDate: new Date(
            new Date().setMonth(new Date().getMonth() - 1)
        ).toISOString(),
        endDate: new Date().toISOString(),
    });

    const { data: analytics, isLoading: analyticsLoading } =
        usePaymentAnalytics(dateRange);
    const { data: summary, isLoading: summaryLoading } = usePaymentSummary();

    if (analyticsLoading || summaryLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Payment Analytics</h1>
                <p className="text-gray-600">
                    Track and analyze supplier payments
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Total Payments
                            </p>
                            <p className="text-2xl font-bold">
                                {analytics?.totalPayments}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Total Amount
                            </p>
                            <p className="text-2xl font-bold">
                                ₹{analytics?.totalAmount.toLocaleString()}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Payment</p>
                            <p className="text-2xl font-bold">
                                ₹{analytics?.avgPaymentAmount.toLocaleString()}
                            </p>
                        </div>
                        <BarChart className="w-8 h-8 text-purple-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-orange-600">
                                ₹{analytics?.pendingAmount.toLocaleString()}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-orange-500" />
                    </div>
                </Card>
            </div>

            {/* Payment Methods Breakdown */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Payments by Method
                </h3>
                <div className="space-y-3">
                    {analytics?.paymentsByMethod.map((method) => (
                        <div
                            key={method.method}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-32 font-medium">
                                    {method.method}
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{
                                            width: `${(method.amount / analytics.totalAmount) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">
                                    ₹{method.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {method.count} payments
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Top Parties */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Top Suppliers by Payments
                </h3>
                <div className="space-y-2">
                    {analytics?.paymentsByParty
                        .slice(0, 5)
                        .map((party, index) => (
                            <div
                                key={party.partyId}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {party.partyName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {party.count} payments
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right font-semibold text-green-600">
                                    ₹{party.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                </div>
            </Card>
        </div>
    );
};
