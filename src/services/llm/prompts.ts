export const prompts = {
  gist: (subject: string, excerpt: string, currentUser: string) =>
    `You write one-line email gists for ${currentUser}. One sentence, no quotes, no preamble. Operational, not a subject recap.\nSubject: ${subject}\nMail:\n${excerpt}`,
  summary: (body: string) =>
    `Summarise this email as exactly three short bullets. No title, no numbering, one bullet per line.\n\n${body}`,
  reply: (currentUser: string, tone: string, thread: string) =>
    `Write a ${tone} reply as ${currentUser}. No greeting fluff unless needed. Do not send meta commentary. Just the email body.\n\n${thread}`,
  inboxBrief: (currentUser: string, threads: string) =>
    `Write exactly three operational bullets for ${currentUser}'s inbox: what they must do now. One line each. No title. Do not invent work.\n\n${threads}`,
  orgNarrative: (stats: string) =>
    `Write 3-5 sentences of an ops narrative from these aggregates only. Do not mention message bodies (there are none). Name people by id if needed.\n\n${stats}`,
  compose: (intent: string, fromName: string) =>
    `Write a subject line then a blank line then an email body. The author is ${fromName}. Intent: ${intent}`,
}
