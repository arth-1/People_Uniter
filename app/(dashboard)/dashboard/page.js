import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getProfile, listGroups, listEvents, getRecommendedGroups } from "@/services/data";

export default async function DashboardPage() {
  const [profile, groups, events, recommendedGroups] = await Promise.all([
    getProfile(),
    listGroups(),
    listEvents(),
    getRecommendedGroups(5),
  ]);

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="text-lg font-semibold text-slate-900">{profile?.name ?? profile?.email ?? "Member"}</p>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Live</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Groups" value={groups?.length ?? 0} hint="Joined or owned" />
            <StatCard label="Events" value={events?.length ?? 0} hint="Upcoming" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">🎯 Recommended for You</p>
            <Link href="/recommendations" className="text-xs font-semibold text-blue-600 hover:underline">See all</Link>
          </div>
          <div className="mt-3 space-y-3">
            {recommendedGroups?.length ? (
              recommendedGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-white px-3 py-2 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-600 line-clamp-1">{group.description}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {(group.rec_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">Generating recommendations...</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Groups" items={groups} empty="No groups yet" render={(g) => (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{g.name}</p>
              <p className="text-sm text-slate-600">{g.description ?? ""}</p>
            </div>
            <span className="text-xs text-slate-500">{g.type}</span>
          </div>
        )} />
        <Card title="Events" items={events} empty="No events scheduled" render={(e) => (
          <div>
            <p className="font-semibold text-slate-900">{e.title}</p>
            <p className="text-sm text-slate-600">{e.groups?.name ?? ""}</p>
            <p className="text-xs text-slate-500">{e.time ? new Date(e.time).toLocaleString() : "TBD"}</p>
          </div>
        )} />
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Card({ title, items, empty, render }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
      </div>
      <div className="space-y-3">
        {items?.length ? items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {render(item)}
          </div>
        )) : (
          <p className="text-sm text-slate-600">{empty}</p>
        )}
      </div>
    </div>
  );
}
