export default function Loading() {
  return <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8"><div className="mb-8 h-12 w-64 rounded-xl bg-gray-100" /><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index}><div className="aspect-square rounded-2xl bg-gray-200" /><div className="mt-3 h-4 w-2/3 rounded bg-gray-100" /><div className="mt-2 h-4 w-1/2 rounded bg-gray-100" /></div>)}</div></div>;
}
