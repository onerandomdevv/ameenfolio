import { z } from "zod";

export const assistantMessageSchema = z.object({
  threadId: z.uuid().optional(),
  message: z.string().trim().min(1).max(8_000),
  model: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
});

export const assistantDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

export const assistantThreadIdSchema = z.uuid();

export const assistantThreadMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    title: z.string().trim().min(1).max(80),
  }),
  z.object({
    action: z.literal("set_pinned"),
    pinned: z.boolean(),
  }),
]);
