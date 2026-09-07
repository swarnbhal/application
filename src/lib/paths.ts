import type { Folder } from "@/types/mail"

export function folderFromPath(pathname: string): Folder {
  if (pathname.startsWith("/unread")) return "unread"
  if (pathname.startsWith("/sent")) return "sent"
  return "inbox"
}

export function folderPath(folder: Folder): string {
  return `/${folder}`
}
