import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      className="antialiased font-sans flex flex-col items-center justify-center min-h-dvh p-6 sm:p-10 w-full h-full"
      role="alert"
    >
      <div className="max-w-md w-full text-center space-y-8 p-8 sm:p-10 transition-all duration-300">
        <svg
          className="mx-auto h-14 w-14 text-sky-600 dark:text-sky-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>

        <div className="space-y-3">
          <h1 className="text-7xl sm:text-8xl font-extrabold tracking-tighter text-gray-800 dark:text-gray-200">
            401
          </h1>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Unauthorized Access
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You do not have the necessary permissions to view this resource.
            Please contact an administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-4">
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
