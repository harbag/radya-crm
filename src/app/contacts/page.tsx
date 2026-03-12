import Link from "next/link";
import { CONTACTS, STATUS_CONFIG } from "@/lib/mock-data";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ContactsPage() {
  const statusCounts = CONTACTS.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {CONTACTS.length} total contacts
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + Add Contact
        </Link>
      </div>

      {/* Status summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["lead", "prospect", "customer", "churned"] as const).map(
          (status) => (
            <div
              key={status}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {statusCounts[status] || 0}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {STATUS_CONFIG[status].label}s
              </p>
            </div>
          )
        )}
      </div>

      {/* Contacts table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left font-medium text-zinc-500">
                Name
              </th>
              <th className="hidden px-6 py-3 text-left font-medium text-zinc-500 sm:table-cell">
                Company
              </th>
              <th className="hidden px-6 py-3 text-left font-medium text-zinc-500 md:table-cell">
                Contact
              </th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {CONTACTS.map((contact) => {
              const statusCfg = STATUS_CONFIG[contact.status];
              return (
                <tr
                  key={contact.id}
                  className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {contact.name}
                        </p>
                        {contact.notes && (
                          <p className="max-w-xs truncate text-xs text-zinc-400">
                            {contact.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                    {contact.company}
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {contact.email}
                    </p>
                    <p className="text-xs text-zinc-400">{contact.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(contact.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
