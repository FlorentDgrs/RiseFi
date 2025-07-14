import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RainbowKitAndWagmiProvider>{children}</RainbowKitAndWagmiProvider>
      </body>
    </html>
  );
}
