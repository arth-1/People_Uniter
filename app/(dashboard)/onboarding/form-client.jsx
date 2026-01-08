"use client";

import { useState } from "react";
import { InterestSelector } from "@/components/interest-selector";
import { branches, years } from "@/lib/constants";

export default function OnboardingFormClient({ interestOptions, defaultInterests, defaultProfile }) {
  const [interests, setInterests] = useState(defaultInterests ?? []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-800">
          Full name
          <input
            name="name"
            defaultValue={defaultProfile?.name || ""}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-800">
          Year
          <select
            name="year"
            defaultValue={defaultProfile?.year || ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-800">
          Branch
          <select
            name="branch"
            defaultValue={defaultProfile?.branch || ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-800">
          Visibility
          <select
            name="visibility"
            defaultValue={defaultProfile?.visibility || "public"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="public">Public</option>
            <option value="community">Community only</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>
      <label className="space-y-1 text-sm font-medium text-slate-800">
        Bio
        <textarea
          name="bio"
          rows={3}
          defaultValue={defaultProfile?.bio || ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Interests</p>
          <p className="text-xs text-slate-500">Add and weight what you care about</p>
        </div>
        <InterestSelector options={interestOptions} initial={interests} onChange={setInterests} />
        <input type="hidden" name="interests" value={JSON.stringify(interests)} readOnly />
      </div>
    </div>
  );
}
