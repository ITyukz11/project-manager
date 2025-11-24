
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="antialiased font-sans flex flex-col items-center justify-center min-h-dvh p-6 sm:p-10 w-full h-full"
      role="alert"     >
      <div className="max-w-md w-full text-center space-y-8 p-8 sm:p-10 transition-all duration-300">

        <svg
          className="mx-auto h-14 w-14 text-red-600 dark:text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        {/* Error Code and Message */}
        <div className="space-y-3">
          <h1
            className="text-7xl sm:text-8xl font-extrabold tracking-tighter text-gray-800 dark:text-gray-200"
          >
            400
          </h1>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            This page could not be found.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Something unexpected happened on the server. We are looking into it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-gray-400 px-8 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:focus-visible:ring-gray-300"
            prefetch={false}
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}