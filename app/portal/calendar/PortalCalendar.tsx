"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/lib/hooks";
import { formatDate, formatTime, parseAirtableDate } from "@/lib/utils";
import type { AirtableRecord, JobFields } from "@/lib/airtable";

type JobsResp = { data: AirtableRecord<JobFields>[] };

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "#3b82f6",
  Completed: "#10b981",
  Cancelled: "#ef4444",
  "No Show": "#94a3b8",
};

export default function PortalCalendar({ employeeName }: { employeeName: string }) {
  const { data: jobsResp, loading } = useFetch<JobsResp>("/api/airtable/jobs");
  const jobs = jobsResp?.data || [];

  const [selected, setSelected] = useState<AirtableRecord<JobFields> | null>(null);

  const events = useMemo(() => {
    return jobs
      .filter((j) => {
        const assignedTo = j.fields["Assigned To"] || [];
        if (!assignedTo.includes(employeeName)) return false;
        const status = j.fields["Job Status"] || "";
        if (status === "Cancelled") return false;
        return !!(j.fields["Job Date"] || j.fields["Job Time"]);
      })
      .map((j) => {
        const address =
          (Array.isArray(j.fields["Client Address"])
            ? j.fields["Client Address"][0]
            : j.fields["Client Address"]) || "Address TBD";
        const status = j.fields["Job Status"] || "Scheduled";
        const jobDateParsed = parseAirtableDate(j.fields["Job Date"]);
        const isPast =
          !!jobDateParsed && jobDateParsed.getTime() < Date.now() - 86400000;
        return {
          id: j.id,
          title: address,
          start: j.fields["Job Time"] || j.fields["Job Date"],
          end: j.fields["Job End Time"] || undefined,
          backgroundColor: STATUS_COLORS[status] || "#64748b",
          borderColor: STATUS_COLORS[status] || "#64748b",
          textColor: "#ffffff",
          extendedProps: { record: j },
          classNames: isPast ? ["opacity-70"] : [],
        };
      });
  }, [jobs, employeeName]);

  function onEventClick(arg: EventClickArg) {
    const rec = (arg.event.extendedProps as { record: AirtableRecord<JobFields> }).record;
    setSelected(rec);
  }

  const selectedAddress =
    selected
      ? (Array.isArray(selected.fields["Client Address"])
          ? selected.fields["Client Address"][0]
          : selected.fields["Client Address"]) || "—"
      : "—";

  return (
    <>
      {loading && (
        <div className="text-center text-sm text-ink-400 py-8">Loading your schedule…</div>
      )}

      {!loading && (
        <div className="card p-3 md:p-5">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            timeZone="UTC"
            height="auto"
            events={events}
            eventClick={onEventClick}
            dayMaxEvents={3}
            eventDisplay="block"
          />
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Job Details"
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Date">
              {formatDate(selected.fields["Job Date"])}
              {selected.fields["Job Time"] && ` · ${formatTime(selected.fields["Job Time"])}`}
            </Row>
            <Row label="Address">{selectedAddress}</Row>
            <Row label="Status">{selected.fields["Job Status"] || "Scheduled"}</Row>
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-[90px] text-[11px] uppercase tracking-wider text-ink-400 font-semibold pt-0.5 shrink-0">
        {label}
      </div>
      <div className="flex-1 text-ink-800">{children}</div>
    </div>
  );
}
