import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getProfile } from "@/services/data";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <AppShell title="Profile">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">Visibility: {profile?.visibility ?? "public"}</p>
            <h2 className="text-xl font-semibold text-slate-900">{profile?.name ?? "Your name"}</h2>
            <p className="text-sm text-slate-600">{profile?.bio ?? "Add a short bio"}</p>
            <p className="mt-2 text-sm text-slate-600">{[profile?.branch, profile?.year].filter(Boolean).join(" • ")}</p>
          </div>
          <Link href="/profile/edit" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:border-slate-300">
            Edit
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-900">Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile?.user_interests?.length ? (
              profile.user_interests.map((interest) => (
                <span
                  key={interest.interest_id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                >
                  {interest.interests?.name ?? `Interest ${interest.interest_id}`}
                  <span className="text-[10px] text-slate-500">{Number(interest.weight ?? 0.5).toFixed(2)}</span>
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-600">No interests yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
