export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/20 sm:p-12">
        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-300 uppercase">
          Paretoium
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Course paths, optimized.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          The web app foundation is ready. The Go optimizer will power course
          path recommendations as the product is built out.
        </p>
        <div className="mt-10 flex flex-wrap gap-2">
          {["Next.js", "TypeScript", "Tailwind CSS"].map((technology) => (
            <span
              key={technology}
              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
            >
              {technology}
            </span>
          ))}
        </div>
        <p className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400">
          Frontend and optimizer are separate services connected over HTTP.
        </p>
      </section>
    </main>
  );
}
