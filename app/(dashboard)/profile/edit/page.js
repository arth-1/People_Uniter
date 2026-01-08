import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getInterests, getProfile, updateUserInterests, upsertProfile } from "@/services/data";
import OnboardingFormClient from "../../onboarding/form-client";

async function saveProfile(formData) {
  "use server";
  const name = formData.get("name");
  const year = formData.get("year");
  const branch = formData.get("branch");
  const bio = formData.get("bio");
  const visibility = formData.get("visibility") || "public";
  const interests = JSON.parse(formData.get("interests") || "[]");

  await upsertProfile({ name, year, branch, bio, visibility });
  await updateUserInterests(interests ?? []);
  redirect("/profile");
}

export default async function EditProfilePage() {
  const [interestOptionsRaw, profile] = await Promise.all([getInterests(), getProfile()]);
  const interestOptions = interestOptionsRaw ?? [];
  const selectedInterests = profile?.user_interests?.map((row) => ({
    interest_id: row.interest_id,
    weight: row.weight ?? 0.5,
  })) ?? [];

  return (
    <AppShell title="Edit Profile">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={saveProfile} className="space-y-6">
          <OnboardingFormClient
            interestOptions={interestOptions}
            defaultInterests={selectedInterests}
            defaultProfile={profile}
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
