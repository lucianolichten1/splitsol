import { UserProfile } from "../types";
import { randomUuid } from "./randomUuid";

export function createDefaultUserProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    id: randomUuid(),
    displayName: "Luciano",
    username: "luciano",
    createdAt: now,
    updatedAt: now,
  };
}
