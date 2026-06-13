import { createFileRoute } from "@tanstack/react-router";
import { MemberLimits } from "@/components/billing/MemberLimits";

export const Route = createFileRoute("/app/billing/members")({
  head: () => ({ meta: [{ title: "Member limits — CodingClerks" }] }),
  component: MembersPage,
});

function MembersPage() {
  return (
    <section>
      <MemberLimits />
    </section>
  );
}
