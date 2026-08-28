import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Routine — Growth Mindset",
    short_name: "Routine",
    description: "Suivi de routine personnelle et journal de growth mindset",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
  };
}
