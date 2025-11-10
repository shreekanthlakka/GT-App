import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Label,
} from "@repo/ui";
import { useAuth } from "../hooks/use-auth";
// import { LoginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { LoginSchema, type LoginType } from "@repo/common/schemas";

export default function LoginPage() {
    const { login, isLoggingIn, isAuthenticated } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginType>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = (data: LoginType) => {
        login(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        GangadharaTextiles
                    </CardTitle>
                    <CardDescription className="text-center">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                {...register("email")}
                                error={errors.email?.message}
                                disabled={isLoggingIn}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                {...register("password")}
                                error={errors.password?.message}
                                disabled={isLoggingIn}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoggingIn}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        <p>Demo credentials:</p>
                        <p className="font-mono text-xs mt-1">
                            owner@gangadharatextiles.com / password123
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
