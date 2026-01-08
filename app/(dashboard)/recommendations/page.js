import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getRecommendedGroups, getProfile } from "@/services/data";
import { joinGroup } from "@/services/data";

async function joinAction(formData) {
  "use server";
  const groupId = Number(formData.get("group_id"));
  await joinGroup(groupId);
}

export default async function RecommendationsPage() {
  const [recommendedGroups, profile] = await Promise.all([
    getRecommendedGroups(20),
    getProfile(),
  ]);

  return (
    <AppShell title="🎯 Recommendations">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">ML POWERED</span>
          <p className="text-sm text-slate-600">
            Personalized group recommendations based on your interests and activity
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Using DQN reinforcement learning trained on user interactions • Model: /ml/dqn_recommender.pth
        </p>
      </div>

      {recommendedGroups?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedGroups.map((group, index) => {
            const isMember = group.group_members?.some((m) => m.user_id === profile?.id);
            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-xs font-bold text-white">
                      {(group.rec_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group.type}</span>
                </div>
                <Link href={`/groups/${group.id}`} className="block mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition">
                    {group.name}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{group.description || "No description"}</p>
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span>👥 {group.group_members?.length ?? 0} members</span>
                </div>
                <form action={joinAction}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <button
                    type="submit"
                    disabled={isMember}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
                      isMember
                        ? "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    }`}
                  >
                    {isMember ? "✓ Already joined" : "Join group"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No recommendations yet</h3>
          <p className="text-sm text-slate-600 mb-4">
            Complete your profile and join some groups to get personalized recommendations.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Complete profile
            </Link>
            <Link
              href="/groups"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300"
            >
              Browse groups
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
