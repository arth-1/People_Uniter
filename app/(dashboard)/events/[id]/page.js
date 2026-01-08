import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getEvent, logInteraction } from "@/services/data";

async function rsvpAction(formData) {
  "use server";
  const eventId = formData.get("event_id");
  await logInteraction({ target_type: "event", target_id: String(eventId), action: "attend" });
}

export default async function EventDetailPage({ params }) {
  // Next.js 16: params is a Promise in async server components
  const { id } = await params;
  const eventId = Number(id);
  const event = await getEvent(eventId);

  return (
    <AppShell title={event?.title ?? "Event"}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">{event?.description}</p>
        <p className="text-xs text-slate-500">{event?.time ? new Date(event.time).toLocaleString() : "TBD"}</p>
        {event?.groups ? (
          <Link href={`/groups/${event.groups.id}`} className="mt-2 block text-sm font-semibold text-blue-600 hover:underline">
            View group
          </Link>
        ) : null}
        <form action={rsvpAction} className="mt-4">
          <input type="hidden" name="event_id" value={eventId} />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
            RSVP / mark attend
          </button>
        </form>
      </div>
    </AppShell>
  );
}
