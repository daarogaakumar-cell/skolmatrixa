import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryBooksClient } from "@/components/dashboard/library-books-client";

export default async function LibraryBooksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <LibraryBooksClient />;
}
