import { ShieldX } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";

export default function Forbidden() {
  return (
    <StatusPage
      code="403 / OWNER ONLY"
      title="Access denied"
      description="This admin is restricted to the configured GitHub owner."
      actionLabel="Return to portfolio"
      actionHref="/"
      icon={ShieldX}
    />
  );
}
