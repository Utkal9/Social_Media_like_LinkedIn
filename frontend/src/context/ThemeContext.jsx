import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Provide default values to prevent the "undefined" crash during SSR
const ThemeContext = createContext({
    theme: "dark",
    toggleTheme: () => {},
    mounted: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("app-theme");
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: light)").matches
        ) {
            setTheme("light");
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("app-theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
    };

    // 2. Render the Provider ALWAYS (Do not return just children)
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
};
