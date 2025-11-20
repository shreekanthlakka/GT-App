import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import {
    setCredentials,
    logout as logoutAction,
} from "@/app/store/slices/authSlice";
import { queryKeys } from "@/app/providers/query-client";
import type { RootState } from "@/app/store";
import type { LoginCredentials } from "../types/auth.types";

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useSelector(
        (state: RootState) => state.auth
    );

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (credentials: LoginCredentials) =>
            authApi.login(credentials),
        onSuccess: (response) => {
            dispatch(
                setCredentials({
                    user: response.data.user,
                    token: response.data.token,
                })
            );
            toast.success("Login successful!");
            navigate("/dashboard");
        },
        onError: (error: any) => {
            toast.error(error.message || "Login failed");
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            dispatch(logoutAction());
            toast.success("Logged out successfully");
            navigate("/login");
        },
    });

    // Get profile query
    const profileQuery = useQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => authApi.getProfile(),
        enabled: isAuthenticated,
    });

    return {
        user,
        token,
        isAuthenticated,
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
        profile: profileQuery.data?.data,
        isLoadingProfile: profileQuery.isLoading,
    };
};
