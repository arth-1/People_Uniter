import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listEvents, logInteraction, getRecommendedEvents } from "@/services/data";

async function rsvpAction(formData) {
  "use server";
  const eventId = formData.get("event_id");
  await logInteraction({ target_type: "event", target_id: String(eventId), action: "attend" });
}

export default async function EventsPage() {
  const [events, recommended] = await Promise.all([
    listEvents(),
    getRecommendedEvents(6),
  ]);

  return (
    <AppShell title="Events">
      <p className="text-sm text-slate-600">Discover and RSVP to events.</p>

      {/* Recommended Events Section */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900">🎯 Recommended Events</h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">ML POWERED</span>
        </div>
        {recommended?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((evt) => (
              <div key={evt.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-xs font-bold text-white">
                    {(evt.rec_score * 100).toFixed(0)}% match
                  </span>
                  <span className="text-xs text-slate-500">{evt.groups?.name ?? ""}</span>
                </div>
                <Link href={`/events/${evt.id}`} className="block mb-2">
                  <p className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition">{evt.title}</p>
                </Link>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{evt.description || "No description"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{evt.time ? new Date(evt.time).toLocaleString() : "TBD"}</span>
                  <form action={rsvpAction}>
                    <input type="hidden" name="event_id" value={evt.id} />
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                      RSVP
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No personalized event picks yet.</p>
        )}
      </div>
      <div className="mt-6 space-y-4">
        {events?.length ? (
          events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/events/${event.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
                    {event.title}
                  </Link>
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <p className="text-xs text-slate-500">{event.time ? new Date(event.time).toLocaleString() : "TBD"}</p>
                  <p className="text-xs text-slate-500">Group: {event.groups?.name ?? ""}</p>
                </div>
                <form action={rsvpAction}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
                    RSVP
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">No events found.</p>
        )}
      </div>
    </AppShell>
  );
}
