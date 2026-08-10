export const bippyDialogues = {
  welcome: {
    text: "Hi, I'm Bippy. Welcome.",
    duration: 4_500,
  },
  now: {
    text: "Here's what Ameen is focused on right now.",
    duration: 4_200,
  },
  projects: {
    text: "These are the things Ameen has shipped.",
    duration: 4_200,
  },
  recognitions: {
    text: "A few moments worth celebrating.",
    duration: 4_000,
  },
  stack: {
    text: "Tools change. Good engineering decisions matter more.",
    duration: 5_200,
  },
  resume: {
    text: "The short version of what Ameen has been building.",
    duration: 4_200,
  },
  contact: {
    text: "This is the easiest way to reach Ameen.",
    duration: 4_200,
  },
  "projects-route": {
    text: "Let's explore the projects.",
    duration: 3_800,
  },
  "project-opened": {
    text: "Nice choice!",
    duration: 2_000,
  },
  "projects-dwell": {
    text: "Want to build something thoughtful together?",
    duration: 6_000,
    action: { label: "Start a conversation", href: "/#contact" },
  },
} as const;

export type BippyDialogueKey = keyof typeof bippyDialogues;

export function isBippyDialogueKey(
  value: string | undefined,
): value is BippyDialogueKey {
  return Boolean(value && value in bippyDialogues);
}
