import {
    accountsService,
    type ApiResponse,
    type PaginatedResponse,
} from "@/shared/utils/api-client";
import type {
    Party,
    PartyFilters,
    CreatePartyDto,
    UpdatePartyDto,
} from "../types/party.types";

export const partiesApi = {
    // List parties with filters
    getParties: async (
        filters: PartyFilters
    ): Promise<ApiResponse<PaginatedResponse<Party>>> => {
        return accountsService.get("/parties", { params: filters });
    },

    // Get single party
    getParty: async (id: string): Promise<ApiResponse<Party>> => {
        return accountsService.get(`/parties/${id}`);
    },

    // Create party
    createParty: async (data: CreatePartyDto): Promise<ApiResponse<Party>> => {
        return accountsService.post("/parties", data);
    },

    // Update party
    updateParty: async (
        id: string,
        data: UpdatePartyDto
    ): Promise<ApiResponse<Party>> => {
        return accountsService.put(`/parties/${id}`, data);
    },

    // Delete party
    deleteParty: async (id: string): Promise<ApiResponse<void>> => {
        return accountsService.delete(`/parties/${id}`);
    },

    // Get party ledger
    getPartyLedger: async (
        id: string,
        params?: any
    ): Promise<ApiResponse<any>> => {
        return accountsService.get(`/parties/${id}/ledger`, { params });
    },

    // Get party statement
    getPartyStatement: async (
        id: string,
        params?: any
    ): Promise<ApiResponse<any>> => {
        return accountsService.get(`/parties/${id}/statement`, { params });
    },

    // Get party analytics
    getPartyAnalytics: async (): Promise<ApiResponse<any>> => {
        return accountsService.get("/parties/analytics");
    },
};
