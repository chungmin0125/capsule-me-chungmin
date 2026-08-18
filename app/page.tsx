import { HomeScreen } from "@/components/home-screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사진과 편지를 묻는 타임캡슐",
  alternates: {
    canonical: "/",
  },
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = await searchParams;
  const buried = query.buried;
  const justBuried = Array.isArray(buried) ? buried[0] === "1" : buried === "1";

  return <HomeScreen justBuried={justBuried} />;
}
