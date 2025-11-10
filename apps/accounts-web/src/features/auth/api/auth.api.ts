import { authService } from "@/shared/utils/api-client";
import type { LoginCredentials, AuthResponse, User } from "../types/auth.types";
import type { ApiResponse } from "@/shared/utils/api-client";

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return authService.post("/auth/login", credentials);
    },

    logout: async (): Promise<ApiResponse<void>> => {
        return authService.post("/auth/logout");
    },

    getProfile: async (): Promise<ApiResponse<User>> => {
        return authService.get("/auth/getProfile");
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
        return authService.post("/auth/updateProfile", data);
    },

    changePassword: async (data: {
        currentPassword: string;
        newPassword: string;
    }): Promise<ApiResponse<void>> => {
        return authService.post("/auth/changePassword", data);
    },
};
