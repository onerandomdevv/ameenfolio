import { ArrowLeft } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";

export default function NotFound() {
  return (
    <StatusPage
      code="404 / NOT FOUND"
      title="Page not found"
      description="The requested page does not exist or has been moved."
      actionLabel="Return to portfolio"
      actionHref="/"
      icon={ArrowLeft}
    />
  );
}
