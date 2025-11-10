import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
}

const initialState: UIState = {
    sidebarOpen: true,
    sidebarCollapsed: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },
        toggleSidebarCollapse: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
    },
});

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapse } =
    uiSlice.actions;
export default uiSlice.reducer;
