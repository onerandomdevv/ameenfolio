import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FormTextFieldProps = {
  label: string;
  type?: string;
  description?: string;
  error?: string;
  className?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
};

export function FormTextField({
  label,
  type = "text",
  description,
  error,
  className,
  inputProps,
}: FormTextFieldProps) {
  const id = inputProps.id ?? inputProps.name;

  return (
    <Field className={cn(className)} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
