import { desc } from "drizzle-orm";
import MessagesManager, {
  type AdminMessage,
} from "@/components/admin/MessagesManager";
import { contactSubmissions, db } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminMessagesPage() {
  await requireAdminSession();

  const messages = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.created_at));

  const serializedMessages: AdminMessage[] = messages.map((message) => ({
    ...message,
    created_at: message.created_at.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-bold text-[#121F38]">
          Messages
        </h1>
        <p className="mt-2 font-sans text-sm text-[#6B7896]">
          Read contact submissions and clear the inbox.
        </p>
      </div>

      <MessagesManager messages={serializedMessages} />
    </div>
  );
}
