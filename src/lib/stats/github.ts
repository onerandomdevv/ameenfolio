import "server-only";

import {
  contributionWindows,
  mergeContributionDays,
  summarizeContributions,
  type ContributionCalendar,
} from "@/lib/stats/contributions";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const REQUEST_TIMEOUT_MS = 10_000;

export type GithubStats = {
  contributions: number;
  currentStreak: number;
  longestStreak: number;
  firstContributionAt: Date | null;
};

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub responded ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join("; "));
  }
  if (!payload.data) {
    throw new Error("GitHub returned no data");
  }
  return payload.data;
}

export async function fetchGithubStats(
  login: string,
  token: string,
  now = new Date(),
): Promise<GithubStats> {
  const account = await graphql<{ user: { createdAt: string } | null }>(
    `
      query ($login: String!) {
        user(login: $login) {
          createdAt
        }
      }
    `,
    { login },
    token,
  );

  if (!account.user) {
    throw new Error(`GitHub user "${login}" not found`);
  }

  // One request with an alias per year, rather than a round trip each.
  const selections = contributionWindows(new Date(account.user.createdAt), now)
    .map(
      (window, index) =>
        `w${index}: contributionsCollection(from: "${window.from.toISOString()}", to: "${window.to.toISOString()}") {
          contributionCalendar { weeks { contributionDays { date contributionCount } } }
        }`,
    )
    .join("\n");

  const calendars = await graphql<{
    user: Record<string, ContributionCalendar>;
  }>(
    `query ($login: String!) {
      user(login: $login) {
        ${selections}
      }
    }`,
    { login },
    token,
  );

  return summarizeContributions(
    mergeContributionDays(Object.values(calendars.user)),
  );
}
