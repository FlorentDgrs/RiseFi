"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
          description:
            "group-[.toast]:text-gray-300 group-[.toast]:text-sm group-[.toast]:opacity-85",
          actionButton:
            "group-[.toast]:bg-yellow-500 group-[.toast]:text-gray-900 group-[.toast]:hover:bg-yellow-400 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-gray-600 group-[.toast]:text-gray-200 group-[.toast]:hover:bg-gray-500 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-200 group-[.toast]:opacity-60 group-[.toast]:hover:opacity-100 group-[.toast]:transition-opacity",
          title:
            "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-tight group-[.toast]:text-gray-50",
          content:
            "group-[.toast]:text-sm group-[.toast]:leading-relaxed group-[.toast]:text-gray-50",
        },
        style: {
          background: "#1f2937", // Solid gray-800
          color: "#f9fafb", // Solid gray-50
          border: "1px solid #4b5563", // Solid gray-600
          borderRadius: "var(--radius)",
          fontSize: "14px",
          fontWeight: "500",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
