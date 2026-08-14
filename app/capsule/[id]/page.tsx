import { CapsuleDetail } from "@/components/capsule-detail";

export default async function CapsulePage({
  params,
}: PageProps<"/capsule/[id]">) {
  const { id } = await params;

  return <CapsuleDetail id={id} />;
}
