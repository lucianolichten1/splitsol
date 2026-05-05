import { Participant, UserProfile } from "../types";

/** Stable participant id derived from profile (used in new groups/splits). */
export function currentUserParticipantId(profile: UserProfile): string {
  return `m-self-${profile.id}`;
}

export function makeSelfParticipant(profile: UserProfile): Participant {
  return {
    id: currentUserParticipantId(profile),
    nickname: "Me",
    username: profile.username,
    walletAddress: profile.mockWalletAddress,
    isCurrentUser: true,
  };
}

export function participantMatchesProfile(m: Participant, profile: UserProfile): boolean {
  if (m.id === currentUserParticipantId(profile)) return true;
  const w = profile.mockWalletAddress?.trim();
  if (w && m.walletAddress?.trim() === w) return true;
  const u = profile.username.toLowerCase();
  if (m.username && m.username.toLowerCase() === u) return true;
  return false;
}

export function resolveCurrentUserParticipantId(
  participants: Participant[] | undefined,
  profile: UserProfile | null | undefined
): string | null {
  if (!profile || !participants?.length) return null;
  const matched = participants.find((p) => participantMatchesProfile(p, profile));
  return matched?.id ?? null;
}

/**
 * Tags the profile member if present; otherwise prepends a self participant.
 * Use when starting a split so expenses and balances always include the app user when possible.
 */
export function normalizeParticipantsForSplit(
  members: Participant[],
  profile: UserProfile
): Participant[] {
  let found = false;
  const mapped = members.map((m) => {
    if (participantMatchesProfile(m, profile)) {
      found = true;
      return { ...m, isCurrentUser: true };
    }
    return m.isCurrentUser ? { ...m, isCurrentUser: false } : m;
  });
  if (found) return mapped;
  return [makeSelfParticipant(profile), ...mapped];
}

/** Ensures the current user is present exactly once (by profile match) and listed first. */
export function ensureCurrentUserInMembers(
  members: Participant[],
  profile: UserProfile
): Participant[] {
  const self = makeSelfParticipant(profile);
  const others = members.filter((m) => !participantMatchesProfile(m, profile));
  return [self, ...others];
}
