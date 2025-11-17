// apps/accounts-web/src/features/parties/components/PartyForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Card } from "@repo/ui";
import { CreatePartySchema } from "@repo/common/schemas";
import type { CreatePartyType, UpdatePartyType } from "@repo/common/schemas";

interface PartyFormProps {
    onSubmit: (data: CreatePartyType | UpdatePartyType) => Promise<void>;
    initialData?: UpdatePartyType;
    isLoading?: boolean;
}

export const PartyForm = ({
    onSubmit,
    initialData,
    isLoading,
}: PartyFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreatePartyType>({
        resolver: zodResolver(CreatePartySchema),
        defaultValues: initialData || {
            name: "",
            gstNo: "",
            panNo: "",
            phone: "",
            email: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            contactPerson: "",
            category: "",
            paymentTerms: 0,
            creditLimit: 0,
            taxId: "",
            website: "",
            notes: "",
            isActive: true,
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
                    {/* Party Name */}
                    <div>
                        <Label htmlFor="name">
                            Party Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="Enter party/supplier name"
                            error={errors.name?.message}
                        />
                    </div>

                    {/* Contact Person */}
                    <div>
                        <Label htmlFor="contactPerson">Contact Person</Label>
                        <Input
                            id="contactPerson"
                            {...register("contactPerson")}
                            placeholder="Enter contact person name"
                            error={errors.contactPerson?.message}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="Enter phone number"
                            error={errors.phone?.message}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="Enter email address"
                            error={errors.email?.message}
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            {...register("website")}
                            placeholder="Enter website URL"
                            error={errors.website?.message}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            {...register("category")}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select category</option>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Distributor">Distributor</option>
                            <option value="Wholesaler">Wholesaler</option>
                            <option value="Retailer">Retailer</option>
                            <option value="Supplier">Supplier</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Tax & Compliance */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tax & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GST Number */}
                    <div>
                        <Label htmlFor="gstNo">GST Number</Label>
                        <Input
                            id="gstNo"
                            {...register("gstNo")}
                            placeholder="Enter GST number"
                            error={errors.gstNo?.message}
                        />
                    </div>

                    {/* PAN Number */}
                    <div>
                        <Label htmlFor="panNo">PAN Number</Label>
                        <Input
                            id="panNo"
                            {...register("panNo")}
                            placeholder="Enter PAN number"
                            error={errors.panNo?.message}
                        />
                    </div>

                    {/* Tax ID */}
                    <div>
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input
                            id="taxId"
                            {...register("taxId")}
                            placeholder="Enter tax ID"
                            error={errors.taxId?.message}
                        />
                    </div>
                </div>
            </Card>

            {/* Address Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Address Details</h3>
                <div className="grid grid-cols-1 gap-4">
                    {/* Address */}
                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            {...register("address")}
                            placeholder="Enter full address"
                            error={errors.address?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* City */}
                        <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                {...register("city")}
                                placeholder="Enter city"
                                error={errors.city?.message}
                            />
                        </div>

                        {/* State */}
                        <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                {...register("state")}
                                placeholder="Enter state"
                                error={errors.state?.message}
                            />
                        </div>

                        {/* Pincode */}
                        <div>
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                                id="pincode"
                                {...register("pincode")}
                                placeholder="Enter pincode"
                                error={errors.pincode?.message}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Business Terms */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Business Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Credit Limit */}
                    <div>
                        <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                        <Input
                            id="creditLimit"
                            type="number"
                            step="0.01"
                            {...register("creditLimit", {
                                valueAsNumber: true,
                            })}
                            placeholder="Enter credit limit"
                            error={errors.creditLimit?.message}
                        />
                    </div>

                    {/* Payment Terms */}
                    <div>
                        <Label htmlFor="paymentTerms">
                            Payment Terms (Days)
                        </Label>
                        <Input
                            id="paymentTerms"
                            type="number"
                            {...register("paymentTerms", {
                                valueAsNumber: true,
                            })}
                            placeholder="Enter payment terms in days"
                            error={errors.paymentTerms?.message}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Example: 30 for Net 30 days
                        </p>
                    </div>
                </div>
            </Card>

            {/* Bank Details (Optional) */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Bank Details (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input id="bankName" placeholder="Enter bank name" />
                    </div>
                    <div>
                        <Label htmlFor="accountNo">Account Number</Label>
                        <Input
                            id="accountNo"
                            placeholder="Enter account number"
                        />
                    </div>
                    <div>
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input id="ifscCode" placeholder="Enter IFSC code" />
                    </div>
                    <div>
                        <Label htmlFor="branch">Branch</Label>
                        <Input id="branch" placeholder="Enter branch name" />
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Note: Bank details are stored as JSON and need to be handled
                    separately
                </p>
            </Card>

            {/* Additional Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Additional Information
                </h3>
                <div className="space-y-4">
                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            {...register("notes")}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Any additional notes about the party"
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            {...register("isActive")}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label htmlFor="isActive">Active Party</Label>
                    </div>
                </div>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-4">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                    {initialData ? "Update Party" : "Create Party"}
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                    Cancel
                </Button>
            </div>
        </form>
    );
};
