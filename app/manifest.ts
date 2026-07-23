import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Modo GOAT",
    short_name: "Modo GOAT",
    description: "Un simulador de vida para descubrir tu camino profesional.",
    start_url: "/juego",
    display: "standalone",
    background_color: "#0f0e17",
    theme_color: "#0f0e17",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
