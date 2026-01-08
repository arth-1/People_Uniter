import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getGroup, getProfile, joinGroup, leaveGroup } from "@/services/data";

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

export default async function GroupDetailPage({ params }) {
  // In Next.js 16+, params is a Promise in async server components
  const { id } = await params;
  const groupId = Number(id);
  const [group, profile] = await Promise.all([getGroup(groupId), getProfile()]);
  const isMember = group?.group_members?.some((m) => m.user_id === profile?.id);

  return (
    <AppShell title={group?.name ?? "Group"}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{group?.type}</p>
            <h2 className="text-xl font-semibold text-slate-900">{group?.name}</h2>
            <p className="text-sm text-slate-600">{group?.description}</p>
          </div>
          <form action={isMember ? leaveAction : joinAction}>
            <input type="hidden" name="group_id" value={groupId} />
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
                isMember
                  ? "border border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {isMember ? "Leave" : "Join"}
            </button>
          </form>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Events</p>
            <Link
              href={`/groups/${groupId}/events/create`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Create event
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {group?.events?.length ? (
              group.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-slate-300"
                >
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">{event.description}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">No events yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
