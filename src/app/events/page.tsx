import { EventsDemo } from "./_components/events-demo";

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Binding events</h1>
        <p className="text-sm text-zinc-300">
          Fetch an append-only audit log for a binding (`/v1/bindings/:bindingId/events`).
        </p>
      </section>
      <EventsDemo />
    </div>
  );
}

