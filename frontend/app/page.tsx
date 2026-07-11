import ExploreResults from "@/components/ExploreResults";

export const dynamic = "force-dynamic"; // Ensure search params trigger re-renders

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <ExploreResults searchParams={searchParams} title="Remarkable stays, thoughtfully hosted" />;
}
