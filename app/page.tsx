import { HomeScreen } from "@/components/home-screen";

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = await searchParams;
  const buried = query.buried;
  const justBuried = Array.isArray(buried) ? buried[0] === "1" : buried === "1";

  return <HomeScreen justBuried={justBuried} />;
}
