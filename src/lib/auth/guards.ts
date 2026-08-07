export type LinkedAccount = { providerId: string; accountId: string };

export function isAllowedAdminAccount(
  accounts: LinkedAccount[],
  expectedGithubId: string,
) {
  return accounts.some(
    (account) =>
      account.providerId === "github" && account.accountId === expectedGithubId,
  );
}
