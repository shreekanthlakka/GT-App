// apps/accounts-web/src/features/customers/components/CustomerForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CreateCustomerSchema,
    type CreateCustomerType,
} from "@repo/common/schemas";
import { Button, Input, Label, Card } from "@repo/ui";
import type { Customer } from "../api/customers.api";

interface CustomerFormProps {
    initialData?: Customer;
    onSubmit: (data: CreateCustomerType) => void;
    isLoading?: boolean;
}

export const CustomerForm = ({
    initialData,
    onSubmit,
    isLoading,
}: CustomerFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateCustomerType>({
        resolver: zodResolver(CreateCustomerSchema),
        defaultValues: initialData
            ? {
                  name: initialData.name,
                  phone: initialData.phone || "",
                  email: initialData.email || "",
                  address: initialData.address || "",
                  city: initialData.city || "",
                  state: initialData.state || "",
                  pincode: initialData.pincode || "",
                  gstNumber: initialData.gstNumber || "",
                  creditLimit: initialData.creditLimit,
                  dateOfBirth: initialData.dateOfBirth || undefined,
                  anniversary: initialData.anniversary || undefined,
                  preferredContact: initialData.preferredContact as any,
                  tags: initialData.tags || [],
                  notes: initialData.notes || "",
              }
            : {
                  creditLimit: 0,
                  tags: [],
              },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Customer Name *</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            error={errors.name?.message}
                            placeholder="Enter customer name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            {...register("phone")}
                            error={errors.phone?.message}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            error={errors.email?.message}
                            placeholder="Enter email address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                            id="gstNumber"
                            {...register("gstNumber")}
                            error={errors.gstNumber?.message}
                            placeholder="Enter GST number"
                        />
                    </div>
                </div>
            </Card>

            {/* Address Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Address Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            {...register("address")}
                            error={errors.address?.message}
                            placeholder="Enter full address"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                {...register("city")}
                                error={errors.city?.message}
                                placeholder="Enter city"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                {...register("state")}
                                error={errors.state?.message}
                                placeholder="Enter state"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                                id="pincode"
                                {...register("pincode")}
                                error={errors.pincode?.message}
                                placeholder="Enter pincode"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Business Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="creditLimit">Credit Limit</Label>
                        <Input
                            id="creditLimit"
                            type="number"
                            step="0.01"
                            {...register("creditLimit", {
                                valueAsNumber: true,
                            })}
                            error={errors.creditLimit?.message}
                            placeholder="Enter credit limit"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="preferredContact">
                            Preferred Contact
                        </Label>
                        <select
                            id="preferredContact"
                            {...register("preferredContact")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select preferred contact</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            {...register("dateOfBirth")}
                            error={errors.dateOfBirth?.message}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="anniversary">Anniversary</Label>
                        <Input
                            id="anniversary"
                            type="date"
                            {...register("anniversary")}
                            error={errors.anniversary?.message}
                        />
                    </div>
                </div>
            </Card>

            {/* Additional Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Additional Information
                </h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            {...register("notes")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            placeholder="Enter any additional notes"
                        />
                    </div>
                </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isLoading} loading={isLoading}>
                    {initialData ? "Update Customer" : "Create Customer"}
                </Button>
            </div>
        </form>
    );
};
