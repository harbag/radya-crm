"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mock-data";
import type { Company } from "@/lib/types";

type TopClient = {
  company: Company;
  dealCount: number;
  totalValue: number;
};

export default function TopClients({ clients }: { clients: TopClient[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Top Clients by Contract Value
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            No client data
          </p>
        ) : (
          <div className="space-y-3">
            {clients.map((client, i) => (
              <div
                key={client.company.id}
                className="flex items-center gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {client.company.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {client.dealCount} deal{client.dealCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-zinc-700">
                  {formatCurrency(client.totalValue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
