import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RainbowKitAndWagmiProvider>
          {children}
          <Toaster
            position="bottom-right"
            expand={false}
            richColors={true}
            closeButton={true}
            visibleToasts={4}
            offset={16}
            gap={8}
            toastOptions={{
              duration: 4000,
              className: "group",
              style: {
                fontFamily: "inherit",
              },
            }}
          />
        </RainbowKitAndWagmiProvider>
      </body>
    </html>
  );
}
