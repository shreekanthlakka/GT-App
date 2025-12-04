import { authService } from "@/shared/utils/api-client";
import type { User } from "@repo/common/types";
import type { ApiResponse } from "@/shared/utils/api-client";
import { LoginCredentials, AuthResponse } from "@repo/common/types";

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
