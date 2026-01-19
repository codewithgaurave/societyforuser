// src/context/FontContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const premiumFonts = {
  inter: {
    key: "inter",
    label: "Inter",
    css: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    className: "font-inter",
    google: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    family: "Inter, sans-serif"
  },
  poppins: {
    key: "poppins",
    label: "Poppins",
    css: `"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    className: "font-poppins",
    google: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
    family: "Poppins, sans-serif"
  },
  montserrat: {
    key: "montserrat",
    label: "Montserrat",
    css: `"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    className: "font-montserrat",
    google: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
    family: "Montserrat, sans-serif"
  },
  playfair: {
    key: "playfair",
    label: "Playfair Display",
    css: `"Playfair Display", "Times New Roman", serif`,
    className: "font-playfair",
    google: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
    family: "Playfair Display, serif"
  },
  lora: {
    key: "lora",
    label: "Lora",
    css: `"Lora", "Times New Roman", serif`,
    className: "font-lora",
    google: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
    family: "Lora, serif"
  },
  system: {
    key: "system",
    label: "System UI",
    css: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    className: "font-system",
    google: null,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
};

const FontContext = createContext();

export const FontProvider = ({ children }) => {
  const getInitial = () => localStorage.getItem("appFont") || "inter";
  const [fontKey, setFontKey] = useState(getInitial);

  useEffect(() => {
    const font = premiumFonts[fontKey] || premiumFonts.inter;

    // Apply font to document
    document.documentElement.style.setProperty("--app-font", font.css);
    
    // Remove all font classes and add current one
    Object.values(premiumFonts).forEach((f) =>
      document.documentElement.classList.remove(f.className)
    );
    document.documentElement.classList.add(font.className);

    // Remove existing font link
    const prev = document.getElementById("app-font-link");
    if (prev) prev.remove();

    // Add Google Fonts link if needed
    if (font.google) {
      const link = document.createElement("link");
      link.id = "app-font-link";
      link.rel = "stylesheet";
      link.href = font.google;
      document.head.appendChild(link);
    }

    localStorage.setItem("appFont", fontKey);
  }, [fontKey]);

  const changeFont = (key) => {
    if (!premiumFonts[key]) return;
    setFontKey(key);
  };

  return (
    <FontContext.Provider
      value={{
        currentFont: premiumFonts[fontKey],
        fontKey,
        premiumFonts,
        changeFont,
      }}
    >
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => useContext(FontContext);