import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-[#0f0f11] p-6">
      <div className="max-w-sm text-center space-y-4">
        <img
          src="/popohero1_transparent.png?v=2"
          alt="poop.lol"
          className="w-32 h-32 object-contain mx-auto"
        />
        <h1 className="text-2xl font-black text-neutral-950 dark:text-white">
          Sin conexión
        </h1>
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          No pudimos conectar. Vuelve a intentarlo cuando recuperes internet.
        </p>
        <Link
          href="/"
          className="inline-flex px-5 py-3 rounded-2xl bg-amber-400 text-neutral-950 font-black text-sm"
        >
          Reintentar
        </Link>
      </div>
    </main>
  );
}
