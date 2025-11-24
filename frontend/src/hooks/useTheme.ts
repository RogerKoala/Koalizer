import { useState, useEffect, useRef } from "react";

const isViewTransitionSupported = () => "startViewTransition" in document;

export type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
 document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useTheme = () => {
 const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
   ? "dark"
   : "light";
 };

 const [theme, setTheme] = useState<Theme>(getInitialTheme);
 const prevTheme = useRef(theme);

 useEffect(() => {
  localStorage.setItem("theme", theme);

  const changeTheme = () => applyTheme(theme);

  if (prevTheme.current !== theme && isViewTransitionSupported()) {
   (document as any).startViewTransition(changeTheme);
  } else {
   changeTheme();
  }

  prevTheme.current = theme;
 }, [theme]);

 const toggleTheme = () => {
  setTheme((t) => (t === "light" ? "dark" : "light"));
 };

 return { theme, setTheme, toggleTheme };
};
