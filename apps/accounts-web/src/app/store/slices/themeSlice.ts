import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark" | "system";

interface ThemeState {
    theme: Theme;
}

const initialState: ThemeState = {
    theme: (localStorage.getItem("theme") as Theme) || "system",
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload;
            localStorage.setItem("theme", action.payload);

            // Apply theme to document
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");

            if (action.payload === "system") {
                const systemTheme = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light";
                root.classList.add(systemTheme);
            } else {
                root.classList.add(action.payload);
            }
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
