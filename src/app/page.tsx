import { HomeSearch } from "./home-search";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-gradient-to-b from-brand to-[#f4f4f4] px-4 pb-16 pt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="animate-rise max-w-xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Bus tickets</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
              Book a seat. Skip the queue.
            </h1>
            <p className="mt-3 text-lg text-white/90">Oslo, Bergen, and Trondheim coaches are ready for 20 Nov 2026.</p>
          </div>
          <HomeSearch />
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
        {[
          ["Live seat map", "Booked seats stay grey. Tap an open seat to hold it."],
          ["Clear prices", "The total updates as you add seats."],
          ["One login", "Use the header to sign in before you proceed."],
        ].map(([title, copy], index) => (
          <article
            key={title}
            className="animate-rise rounded-2xl bg-white p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <h2 className="text-lg font-bold text-brand">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
