import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { joinGroup, leaveGroup, listGroups, getProfile, getRecommendedGroups } from "@/services/data";

async function joinAction(formData) {
  "use server";
  const groupId = Number(formData.get("group_id"));
  await joinGroup(groupId);
}

async function leaveAction(formData) {
  "use server";
  const groupId = Number(formData.get("group_id"));
  await leaveGroup(groupId);
}

export default async function GroupsPage() {
  const [groups, profile, recommendedGroups] = await Promise.all([
    listGroups(),
    getProfile(),
    getRecommendedGroups(6),
  ]);

  return (
    <AppShell title="Groups">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Create, join, and manage campus groups.</p>
        <Link
          href="/groups/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Create group
        </Link>
      </div>

      {recommendedGroups?.length > 0 && (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold text-slate-900">Recommended for You</h2>
            <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">ML Powered</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedGroups.map((group) => {
              const isMember = group.group_members?.some((m) => m.user_id === profile?.id);
              return (
                <div key={group.id} className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/groups/${group.id}`} className="text-base font-semibold text-slate-900 hover:text-blue-600">
                        {group.name}
                      </Link>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {(group.rec_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{group.description || "No description"}</p>
                  </div>
                  <form action={isMember ? leaveAction : joinAction}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                        isMember
                          ? "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isMember ? "Leave" : "Join"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Groups</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {groups?.length ? (
            groups.map((group) => {
              const isMember = group.group_members?.some((m) => m.user_id === profile?.id);
              return (
                <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/groups/${group.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
                        {group.name}
                      </Link>
                      <p className="text-sm text-slate-600">{group.description || "No description"}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.type}</span>
                  </div>
                  <form action={isMember ? leaveAction : joinAction} className="mt-4">
                    <input type="hidden" name="group_id" value={group.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        isMember
                          ? "border border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                          : "bg-blue-600 text-white hover:bg-blue-500"
                      }`}
                    >
                      {isMember ? "Leave group" : "Join group"}
                    </button>
                  </form>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">No groups yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
