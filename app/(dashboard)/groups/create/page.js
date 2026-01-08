import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createGroup } from "@/services/data";

async function createAction(formData) {
  "use server";
  const name = formData.get("name");
  const description = formData.get("description");
  const type = formData.get("type") || "public";
  const group = await createGroup({ name, description, type });
  redirect(`/groups/${group.id}`);
}

export default function CreateGroupPage() {
  return (
    <AppShell title="Create Group">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createAction} className="space-y-4">
          <label className="space-y-1 text-sm font-medium text-slate-800">
            Name
            <input
              name="name"
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
            Type
            <select
              name="type"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              defaultValue="public"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="flex justify-end">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
              Create
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
