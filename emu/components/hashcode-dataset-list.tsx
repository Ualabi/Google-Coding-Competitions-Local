"use client";

import { useState } from "react";
import type { HashcodeDataset } from "@/lib/catalog";

type RevealState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ok" }
  | { status: "error"; message: string };

const IDLE: RevealState = { status: "idle" };

export function HashcodeDatasetList({
  year,
  round,
  datasets,
}: {
  year: string;
  round: string;
  datasets: HashcodeDataset[];
}) {
  const [stateByFile, setStateByFile] = useState<Record<string, RevealState>>(
    {},
  );

  async function openDataset(filename: string) {
    setStateByFile((prev) => ({ ...prev, [filename]: { status: "pending" } }));
    let next: RevealState;
    try {
      const res = await fetch("/api/hashcode/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, round, filename }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      next = data.ok
        ? { status: "ok" }
        : { status: "error", message: data.error ?? "Something went wrong." };
    } catch {
      next = { status: "error", message: "Couldn't reach the app server." };
    }
    setStateByFile((prev) => ({ ...prev, [filename]: next }));
    setTimeout(() => {
      setStateByFile((prev) =>
        prev[filename] === next ? { ...prev, [filename]: IDLE } : prev,
      );
    }, 2500);
  }

  return (
    <div className="flex h-full flex-col bg-panel text-foreground">
      <div className="flex h-11 shrink-0 items-center border-b border-panel-border px-4">
        <span className="text-xs font-medium text-panel-muted">Datasets</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-sm text-panel-muted">
          Hash Code had no online judge — read the problem in the PDF, then
          open a dataset below to work on it in your own editor.
        </p>
        <ul className="flex flex-col gap-2">
          {datasets.map((dataset) => {
            const state = stateByFile[dataset.filename] ?? IDLE;
            return (
              <li
                key={dataset.filename}
                className="rounded-lg border border-panel-border px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {dataset.title}
                    </div>
                    <div className="truncate text-xs text-panel-muted">
                      {dataset.filename}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDataset(dataset.filename)}
                    disabled={state.status === "pending"}
                    className="shrink-0 rounded-md border border-panel-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue-600 hover:text-blue-600 disabled:opacity-60"
                  >
                    {state.status === "pending"
                      ? "Opening…"
                      : state.status === "ok"
                        ? "Opened ✓"
                        : "Open dataset"}
                  </button>
                </div>
                {state.status === "error" && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {state.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
