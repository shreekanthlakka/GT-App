// apps/accounts-web/src/features/sales/pages/SaleDetailPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useSale } from "../hooks/use-sales";
import { Card, Badge, Button, Table, Skeleton } from "@repo/ui";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";

export const SaleDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: sale, isLoading } = useSale(id!);

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!sale) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Sale not found</h2>
            </div>
        );
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "PAID":
                return "success";
            case "PARTIALLY_PAID":
                return "warning";
            case "OVERDUE":
                return "destructive";
            case "CANCELLED":
            case "RETURNED":
                return "secondary";
            default:
                return "default";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/sales")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Sale #{sale.saleNo}
                        </h1>
                        <p className="text-gray-600">Sale Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={getStatusVariant(sale.status)}>
                        {sale.status}
                    </Badge>
                    {sale.status !== "CANCELLED" && (
                        <Button onClick={() => navigate(`/sales/${id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Sale Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Total Amount
                    </h3>
                    <p className="text-2xl font-bold">
                        ₹{sale.amount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Paid Amount
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                        ₹{sale.paidAmount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Balance
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                        ₹{sale.remainingAmount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Sale Date
                    </h3>
                    <p className="text-lg font-bold">
                        {new Date(sale.date).toLocaleDateString()}
                    </p>
                </Card>
            </div>

            {/* Customer & Sale Info */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Customer Information
                        </h3>
                        <div className="space-y-2">
                            <div className="text-lg font-semibold">
                                {sale.customer.name}
                            </div>
                            {sale.customer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{sale.customer.phone}</span>
                                </div>
                            )}
                            {sale.customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{sale.customer.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Sale Details
                        </h3>
                        <div className="space-y-2">
                            {sale.salesPerson && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Sales Person:{" "}
                                    </span>
                                    <span>{sale.salesPerson}</span>
                                </div>
                            )}
                            {sale.reference && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Reference:{" "}
                                    </span>
                                    <span>{sale.reference}</span>
                                </div>
                            )}
                            {sale.deliveryDate && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Delivery Date:{" "}
                                    </span>
                                    <span>
                                        {new Date(
                                            sale.deliveryDate
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Sale Items */}
            {sale.items && sale.items.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Sale Items
                        </h3>
                    </div>
                    <Table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Type</th>
                                <th>Design</th>
                                <th>Color</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="font-medium">
                                        {item.itemName}
                                    </td>
                                    <td>{item.itemType || "-"}</td>
                                    <td>{item.design || "-"}</td>
                                    <td>{item.color || "-"}</td>
                                    <td>
                                        {item.quantity} {item.unit || "PCS"}
                                    </td>
                                    <td>₹{item.price.toLocaleString()}</td>
                                    <td className="font-semibold">
                                        ₹{item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="p-6 border-t">
                        <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                            {sale.discountAmount > 0 && (
                                <>
                                    <div className="text-gray-600">
                                        Discount:
                                    </div>
                                    <div className="text-right font-semibold">
                                        -₹
                                        {sale.discountAmount.toLocaleString()}
                                    </div>
                                </>
                            )}
                            {sale.taxAmount && (
                                <>
                                    <div className="text-gray-600">
                                        Tax Amount:
                                    </div>
                                    <div className="text-right font-semibold">
                                        ₹{sale.taxAmount.toLocaleString()}
                                    </div>
                                </>
                            )}
                            <div className="text-lg font-semibold">Total:</div>
                            <div className="text-right text-lg font-bold text-blue-600">
                                ₹{sale.amount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Delivery Details */}
            {(sale.deliveryAddress ||
                sale.transportation ||
                sale.vehicleNo) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Delivery Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sale.deliveryAddress && (
                            <div className="col-span-2">
                                <span className="text-sm text-gray-600">
                                    Delivery Address:{" "}
                                </span>
                                <span>{sale.deliveryAddress}</span>
                            </div>
                        )}
                        {sale.transportation && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Transportation:{" "}
                                </span>
                                <span>{sale.transportation}</span>
                            </div>
                        )}
                        {sale.vehicleNo && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Vehicle No:{" "}
                                </span>
                                <span>{sale.vehicleNo}</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Terms & Notes */}
            {(sale.terms || sale.notes) && (
                <Card className="p-6">
                    {sale.terms && (
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                Payment Terms
                            </h3>
                            <p className="text-sm text-gray-700">
                                {sale.terms}
                            </p>
                        </div>
                    )}
                    {sale.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                Notes
                            </h3>
                            <p className="text-sm text-gray-700">
                                {sale.notes}
                            </p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};
