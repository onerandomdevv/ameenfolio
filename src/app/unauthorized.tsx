import { LogIn } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";
import { adminHref } from "@/lib/admin-path";

export default async function Unauthorized() {
  return (
    <StatusPage
      code="401 / AUTHENTICATION REQUIRED"
      title="Sign in required"
      description="Authenticate with the authorized GitHub account to continue."
      actionLabel="Go to admin login"
      actionHref={await adminHref("/login")}
      icon={LogIn}
    />
  );
}
