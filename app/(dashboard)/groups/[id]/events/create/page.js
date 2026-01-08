import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createEvent } from "@/services/data";

async function createAction(groupId, formData) {
  "use server";
  const title = formData.get("title");
  const description = formData.get("description");
  const time = formData.get("time");
  const event = await createEvent({ group_id: groupId, title, description, time });
  redirect(`/events/${event.id}`);
}

export default function CreateEventPage({ params }) {
  const groupId = Number(params.id);

  return (
    <AppShell title="Create Event">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={(formData) => createAction(groupId, formData)} className="space-y-4">
          <label className="space-y-1 text-sm font-medium text-slate-800">
            Title
            <input
              name="title"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-800">
            Description
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-800">
            Time
            <input
              type="datetime-local"
              name="time"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <div className="flex justify-end">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
              Create event
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
