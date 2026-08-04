import { redirect } from "next/navigation";

// Route groups like (auth) and (protected) do not create a URL segment, so
// nothing answers a bare /admin request. Send it on to the dashboard; the
// middleware then bounces unauthenticated visitors to /admin/login.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
