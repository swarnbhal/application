import type { UserRole } from "@/types/mail"

export function canViewActivity(role: UserRole): boolean {
  return role === "admin"
}
