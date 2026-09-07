import type { User } from "@/types/mail"

export const users: User[] = [
  {
    id: "u-alex",
    name: "Alex Duarte",
    email: "alex@northfield.co",
    role: "member",
  },
  {
    id: "u-priya",
    name: "Priya Raman",
    email: "priya@northfield.co",
    role: "admin",
  },
  {
    id: "u-marta",
    name: "Marta Kovac",
    email: "marta@northfield.co",
    role: "member",
  },
  {
    id: "u-sam",
    name: "Sam Osei",
    email: "sam@northfield.co",
    role: "member",
  },
  {
    id: "u-dana",
    name: "Dana Whitfield",
    email: "dana@northfield.co",
    role: "member",
  },
  {
    id: "u-jonah",
    name: "Jonah Reid",
    email: "jonah@northfield.co",
    role: "member",
  },
  {
    id: "u-lee",
    name: "Lee Park",
    email: "lee@northfield.co",
    role: "member",
  },
]

export const DEFAULT_USER_ID = "u-alex"

export const userById = Object.fromEntries(users.map((user) => [user.id, user]))
