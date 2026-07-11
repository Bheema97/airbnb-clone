import ExploreResults from "@/components/ExploreResults";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const location = searchParams.location ? (Array.isArray(searchParams.location) ? searchParams.location[0] : searchParams.location) : "";
  return <ExploreResults searchParams={searchParams} title={location ? `Stays in ${location}` : "Find your next stay"} />;
}
