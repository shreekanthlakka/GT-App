import { useSelector } from "react-redux";
import { Bell, User, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@repo/ui";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useDispatch } from "react-redux";
import { setTheme } from "@/app/store/slices/themeSlice";
import type { RootState } from "@/app/store";

export const Header = () => {
    const { user, logout } = useAuth();
    const dispatch = useDispatch();
    const { theme } = useSelector((state: RootState) => state.theme);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        dispatch(setTheme(newTheme));
    };

    return (
        <header className="sticky top-0 z-10 border-b bg-background">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold">
                        Accounts Management
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>

                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                        <div className="text-right">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {user?.role}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
