import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapMint — One more game.",
  description: "Instant games, little victories, and rewards on Monad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=JSON.parse(localStorage.getItem('tapmint:theme'));document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light'}catch{}` }} /></head><body><Providers>{children}</Providers></body></html>;
}
