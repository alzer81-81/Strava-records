import { redirect } from "next/navigation";
import { prisma } from "./db";
import { readSessionCookie } from "./session";

export async function requireUser() {
  const session = readSessionCookie();
  if (!session) redirect("/");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/");
  return user;
}
