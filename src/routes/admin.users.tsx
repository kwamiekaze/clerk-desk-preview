import { createFileRoute } from "@tanstack/react-router";
import { UsersTable } from "@/components/admin/UsersTable";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · users — CodingClerks" }] }),
  component: UsersTable,
});
