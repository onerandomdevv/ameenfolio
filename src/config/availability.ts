export const availabilityOptions = [
  { value: "open", label: "Open to work" },
  { value: "booked", label: "Booked" },
] as const;

export type Availability = (typeof availabilityOptions)[number]["value"];

export const availabilityValues = availabilityOptions.map(
  (option) => option.value,
) as unknown as readonly [Availability, ...Availability[]];

export const defaultAvailability: Availability = "open";

export function availabilityLabel(value: Availability | string) {
  return (
    availabilityOptions.find((option) => option.value === value)?.label ??
    availabilityOptions[0].label
  );
}
