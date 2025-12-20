import { cn } from "@repo/ui/lib/utils";
import * as React from "react";

function Skeleton({
    className,
    ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "popover">) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
}

export { Skeleton };
