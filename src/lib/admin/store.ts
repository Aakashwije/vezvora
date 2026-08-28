import { teamMembers } from "./seed";

export const useTeam = () => teamMembers;

export function memberById(id: string | null) {
  return teamMembers.find((member) => member.id === id) ?? null;
}
