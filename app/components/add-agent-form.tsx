"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAgent } from "@/app/actions";
import {
  chip,
  chipClass,
  field,
  kicker,
  panel,
  primaryBtn,
} from "@/app/components/chrome";
import { INTERVAL_PRESETS } from "@/lib/schedule-presets";

const WEEKDAYS = [
  { day: 0, label: "Sun" },
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
] as const;

export function AddAgentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"interval" | "clock">("interval");
  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [times, setTimes] = useState<string[]>(["18:00"]);
  const [timeDraft, setTimeDraft] = useState("08:00");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={`flex flex-col gap-5 ${panel}`}
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addAgent({
            name,
            kind,
            intervalSeconds,
            times,
            weekdays,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setName("");
          router.refresh();
        });
      }}
    >
      <h2 className={kicker}>Add agent</h2>
      <label className="flex max-w-xs flex-col gap-2">
        <span className="text-sm text-paper">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          className={field}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chipClass(kind === "interval")}
          onClick={() => setKind("interval")}
        >
          Interval
        </button>
        <button
          type="button"
          className={chipClass(kind === "clock")}
          onClick={() => setKind("clock")}
        >
          Clock times
        </button>
      </div>
      {kind === "interval" ? (
        <div className="flex flex-wrap gap-2">
          {INTERVAL_PRESETS.map((preset) => (
            <button
              key={preset.seconds}
              type="button"
              className={`${chip} ${
                intervalSeconds === preset.seconds
                  ? "border-copper text-copper"
                  : "border-hairline text-muted hover:border-copper hover:text-paper"
              }`}
              onClick={() => setIntervalSeconds(preset.seconds)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {times.map((time) => (
              <li key={time} className="flex items-center gap-3 font-mono text-sm">
                <span>{time}</span>
                <button
                  type="button"
                  className="text-xs text-fail hover:underline"
                  onClick={() =>
                    setTimes((current) => current.filter((item) => item !== time))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-sm text-paper">Time</span>
              <input
                type="time"
                value={timeDraft}
                onChange={(event) => setTimeDraft(event.target.value)}
                className={`${field} max-w-44`}
              />
            </label>
            <button
              type="button"
              className={`${chip} border-hairline text-muted hover:border-copper hover:text-paper`}
              onClick={() => {
                const [hours, minutes] = timeDraft.split(":");
                if (!hours || !minutes) return;
                const next = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
                setTimes((current) =>
                  current.includes(next) ? current : [...current, next],
                );
              }}
            >
              Add time
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((item) => {
              const on = weekdays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  className={`${chip} ${
                    on
                      ? "border-copper text-copper"
                      : "border-hairline text-muted hover:border-copper hover:text-paper"
                  }`}
                  onClick={() =>
                    setWeekdays((current) =>
                      on
                        ? current.filter((day) => day !== item.day)
                        : [...current, item.day].sort((a, b) => a - b),
                    )
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error ? (
        <p className="border border-fail/40 bg-fail/10 px-4 py-3 text-sm text-fail" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={primaryBtn}
      >
        {pending ? "Adding…" : "Add agent"}
      </button>
    </form>
  );
}
