import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} - ${SITE_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(165deg, #fff7ed 0%, #ffe4e6 42%, #f5f5f4 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#a8a29e",
            letterSpacing: "0.18em",
          }}
        >
          TIME CAPSULE
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 88,
            fontWeight: 700,
            color: "#44403c",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            maxWidth: 820,
            fontSize: 32,
            lineHeight: 1.45,
            color: "#78716c",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
