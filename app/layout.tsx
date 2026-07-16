import "./globals.css";
export const metadata = { title: "MHH AI Manager", description: "Private marketing manager for Ma's Helping Hand" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en-AU"><body>{children}</body></html>;
}
