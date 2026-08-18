import { CapsuleDetail } from "@/components/capsule-detail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 캡슐",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function CapsulePage({
  params,
}: PageProps<"/capsule/[id]">) {
  const { id } = await params;

  return <CapsuleDetail id={id} />;
}
