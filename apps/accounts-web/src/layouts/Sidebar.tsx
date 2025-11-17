import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    ShoppingCart,
    Package,
    Image,
    Settings,
} from "lucide-react";
import { cn } from "@repo/ui";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Parties", href: "/parties", icon: Building2 },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Sales", href: "/sales", icon: ShoppingCart },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "OCR Upload", href: "/ocr/upload", icon: Image },
    { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
    return (
        <div className="flex h-full w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center border-b px-6">
                <h2 className="text-lg font-semibold">GangadharaTextiles</h2>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t p-4">
                <p className="text-xs text-muted-foreground text-center">
                    © 2025 GangadharaTextiles
                </p>
            </div>
        </div>
    );
};
