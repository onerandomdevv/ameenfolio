import { LogIn } from "lucide-react";
import { StatusPage } from "@/components/layout/status-page";

export default function Unauthorized() {
  return (
    <StatusPage
      code="401 / AUTHENTICATION REQUIRED"
      title="Sign in required"
      description="Authenticate with the authorized GitHub account to continue."
      actionLabel="Go to admin login"
      actionHref="/admin/login"
      icon={LogIn}
    />
  );
}
