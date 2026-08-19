"use client";

import { useState, useTransition } from "react";
import { decideMcpAuthorization } from "@/app/admin/actions/mcp";
import { Button } from "@/components/ui/button";

type AuthorizationField = {
  name: string;
  value: string;
};

type McpAuthorizationFormProps = {
  fields: AuthorizationField[];
};

export function McpAuthorizationForm({ fields }: McpAuthorizationFormProps) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function authorize(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await decideMcpAuthorization(formData);
        window.location.assign(result.redirectUrl);
      } catch {
        setError("The connection could not be completed. Please try again.");
      }
    });
  }

  return (
    <form action={authorize} className="mt-6">
      {fields.map(({ name, value }) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          name="decision"
          value="deny"
          variant="outline"
          disabled={pending}
        >
          Deny
        </Button>
        <Button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
        >
          {pending ? "Connecting..." : "Connect Bippy"}
        </Button>
      </div>
    </form>
  );
}
