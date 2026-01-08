"use client";

import { useMemo, useState } from "react";

export function InterestSelector({ options, initial = [], onChange }) {
  const [selected, setSelected] = useState(initial);

  const selectedMap = useMemo(() => {
    const map = new Map();
    selected.forEach((item) => map.set(item.interest_id, item.weight));
    return map;
  }, [selected]);

  function toggleInterest(id) {
    let next = [...selected];
    if (selectedMap.has(id)) {
      next = next.filter((item) => item.interest_id !== id);
    } else {
      next.push({ interest_id: id, weight: 0.5 });
    }
    setSelected(next);
    onChange?.(next);
  }

  function updateWeight(id, value) {
    const next = selected.map((item) =>
      item.interest_id === id ? { ...item, weight: Number(value) } : item
    );
    setSelected(next);
    onChange?.(next);
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((interest) => {
          const active = selectedMap.has(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition hover:border-slate-400 ${
                active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white"
              }`}
            >
              <span className="block font-medium">{interest.name}</span>
              <span className="text-xs text-slate-500">{interest.category}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-800">Weights</p>
          <div className="mt-3 space-y-3">
            {selected.map((item) => {
              const meta = options.find((o) => o.id === item.interest_id);
              return (
                <div key={item.interest_id} className="flex items-center gap-3">
                  <span className="min-w-[140px] text-sm text-slate-700">{meta?.name ?? "Interest"}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={item.weight}
                    onChange={(e) => updateWeight(item.interest_id, e.target.value)}
                    className="w-full"
                  />
                  <span className="w-12 text-right text-sm font-medium text-slate-800">
                    {item.weight.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
