import Link from "next/link";

export function AppShell({ title = "", children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              People Uniter
            </Link>
            <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 md:flex">
              <Link href="/dashboard" className="hover:text-slate-900">
                Overview
              </Link>
              <Link href="/onboarding" className="hover:text-slate-900">
                Onboarding
              </Link>
              <Link href="/profile" className="hover:text-slate-900">
                Profile
              </Link>
              <Link href="/groups" className="hover:text-slate-900">
                Groups
              </Link>
              <Link href="/events" className="hover:text-slate-900">
                Events
              </Link>
              <Link href="/recommendations" className="hover:text-slate-900">
                Recommendations
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Link href="/profile" className="rounded-md border px-3 py-1.5 font-medium hover:border-slate-400">
              My Profile
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {title ? <h1 className="text-2xl font-semibold text-slate-900">{title}</h1> : null}
        {children}
      </main>
    </div>
  );
}
