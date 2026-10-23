import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-[#0f0f11] p-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="flex justify-center">
          <SearchX className="w-16 h-16 text-amber-500" />
        </div>
        <h1 className="text-2xl font-black text-neutral-950 dark:text-white">
          Esta página se fue al baño
        </h1>
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          No encontramos lo que buscabas.
        </p>
        <Link
          href="/"
          className="inline-flex px-5 py-3 rounded-2xl bg-amber-400 text-neutral-950 font-black text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
