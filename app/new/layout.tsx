import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캡슐 묻기",
  description:
    "사진과 편지를 넣고 열람일을 정해 타임캡슐을 묻어요. 묻는 날의 날씨가 캡슐 모습이 됩니다.",
  alternates: {
    canonical: "/new",
  },
  openGraph: {
    title: "캡슐 묻기",
    description: "사진과 편지를 넣고 열람일에 함께 여는 타임캡슐을 묻어요.",
    url: "/new",
  },
};

export default function NewCapsuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
