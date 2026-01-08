import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getInterests, getProfile, updateUserInterests, upsertProfile } from "@/services/data";
import OnboardingFormClient from "./form-client";

async function saveOnboarding(formData) {
  "use server";
  const name = formData.get("name");
  const year = formData.get("year");
  const branch = formData.get("branch");
  const bio = formData.get("bio");
  const visibility = formData.get("visibility") || "public";
  const interestsRaw = formData.get("interests") || "[]";
  const interests = JSON.parse(interestsRaw);

  await upsertProfile({ name, year, branch, bio, visibility });
  if (Array.isArray(interests) && interests.length) {
    await updateUserInterests(interests);
  }
  redirect("/dashboard");
}

export default async function OnboardingPage() {
  const [interestOptionsRaw, profile] = await Promise.all([getInterests(), getProfile()]);
  const interestOptions = interestOptionsRaw ?? [];
  const selectedInterests = profile?.user_interests?.map((row) => ({
    interest_id: row.interest_id,
    weight: row.weight ?? 0.5,
  })) ?? [];

  return (
    <AppShell title="Onboarding">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Tell us about you so we can personalize recommendations.</p>
        <form action={saveOnboarding} className="mt-6 space-y-6">
          <OnboardingFormClient interestOptions={interestOptions} defaultInterests={selectedInterests} defaultProfile={profile} />
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">
              Save and continue
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
