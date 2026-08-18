import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff7ed",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: 14,
            height: 22,
            borderRadius: 999,
            background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
          }}
        />
      </div>
    ),
    size,
  );
}
