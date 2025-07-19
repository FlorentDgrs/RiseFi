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
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <title>RiseFi</title>
        <meta
          name="description"
          content="ERC-4626 compliant yield vault with Morpho Blue integration on Base network"
        />
      </head>
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
