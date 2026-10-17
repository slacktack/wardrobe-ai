import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          gap: 10,
        }}
      >
        <div style={{ color: "#d7ff3e", fontSize: 92, fontWeight: 700, lineHeight: 1 }}>W</div>
        <div style={{ color: "#9a9a94", fontSize: 13, letterSpacing: 6 }}>WARDROBE</div>
      </div>
    ),
    { ...size },
  );
}
