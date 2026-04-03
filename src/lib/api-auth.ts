import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requirePatient() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "PATIENT") return null;
  return session;
}

export async function requireStaff() {
  const session = await getSession();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAFF")
  ) {
    return null;
  }
  return session;
}
