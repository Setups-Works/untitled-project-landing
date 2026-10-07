import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Noto_Sans_Tamil } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "../styles/tailwind.css";
import "./globals.css";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";
import HideInApp from "../components/HideInApp";

config.autoAddCss = false;

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500"],
  variable: "--font-tamil",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif-display",
});

export const metadata: Metadata = {
  title: "untitled project — one workspace, any AI",
  description:
    "Notes, tasks, journal, email, calendar, meetings and automations in one workspace. Use AI when it helps, ignore it when it doesn't.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${serif.variable} ${tamil.variable}`}>
      <body>
        <HideInApp>
          <SiteHeader />
        </HideInApp>
        {children}
        <HideInApp>
          <SiteFooter />
        </HideInApp>
      </body>
    </html>
  );
}
