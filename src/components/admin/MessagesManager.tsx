"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export type AdminMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type MessagesManagerProps = {
  messages: AdminMessage[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function MessagesManager({ messages }: MessagesManagerProps) {
  const [items, setItems] = useState(messages);
  const [openId, setOpenId] = useState<string | null>(null);

  async function markAsRead(id: string) {
    const response = await fetch(`/api/admin/messages/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      window.alert("Update failed.");
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
  }

  async function deleteMessage(id: string) {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    const response = await fetch(`/api/admin/messages/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      window.alert("Delete failed.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
      <table className="w-full text-left font-sans text-sm">
        <thead className="bg-[#F4F5F8] text-[#121F38]">
          <tr>
            <th className="px-4 py-3">Sender</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((message) => (
            <tr
              key={message.id}
              onClick={() => setOpenId(openId === message.id ? null : message.id)}
              className="cursor-pointer border-t border-[#C4CAD6]"
            >
              <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                  {!message.is_read ? (
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#121F38]" />
                  ) : null}
                  <div>
                    <p className="font-medium text-[#121F38]">
                      {message.full_name}
                    </p>
                    <p className="text-xs text-[#6B7896]">{message.email}</p>
                    {openId === message.id ? (
                      <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[#2C3A52]">
                        {message.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[#2C3A52]">{message.subject}</td>
              <td className="px-4 py-3 text-[#2C3A52]">
                {formatDate(message.created_at)}
              </td>
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex gap-2">
                  {!message.is_read ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => markAsRead(message.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#DC2626] hover:bg-red-50"
                    onClick={() => deleteMessage(message.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
