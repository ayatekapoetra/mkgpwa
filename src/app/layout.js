import PropTypes from "prop-types";
import "./globals.css";

// PROJECT IMPORTS
import ProviderWrapper from "./ProviderWrapper";
import ServiceWorkerCleanup from "./ServiceWorkerCleanup";

// layout.js atau _app.js
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Pilih sesuai kebutuhanmu
  display: "swap",
});

export const metadata = {
  title: "Makkuraga Dashboard",
  description: "Mining, Exploration and Rental",
  // AGGRESSIVELY disable ALL PWA features
  manifest: null,
  icons: null,
  appleWebApp: null,
  other: {
    // Disable any PWA-related headers
    "theme-color": null,
    // Block service worker registration
    "service-worker-allowed": "/",
    "x-pwa-disabled": "true",
    "x-service-worker-disabled": "true",
    // Prevent caching
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
    expires: "0",
  },
};

export default function RootLayout({ children }) {
  console.log('RootLayout rendering');
  
  return (
    <html lang="en" className={poppins.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ProviderWrapper>
          {children}
          <ServiceWorkerCleanup />
        </ProviderWrapper>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node,
};
