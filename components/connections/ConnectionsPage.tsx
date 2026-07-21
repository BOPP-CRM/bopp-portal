"use client";

import BoppMcpPanel from "@/components/connections/BoppMcpPanel";
import ZortoutPanel from "@/components/connections/ZortoutPanel";
import { useState } from "react";
import OmisellPanel from "./OmisellPanel";

type Tab = "bopp-mcp" | "zortout" | "omisell";

const TABS: { id: Tab; label: string }[] = [
  { id: "bopp-mcp", label: "BOPP MCP" },
  { id: "zortout", label: "Zortout" },
  { id: "omisell", label: "Omisell" },
];

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("bopp-mcp");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-defualt-text">
          การเชื่อมต่อ
        </h1>
        <p className="mt-1 text-sm text-gray-100">
          ตั้งค่าการเชื่อมต่อกับระบบภายนอก
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-4xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-brown-100 text-white"
                : "border border-gray-200 bg-white text-defualt-text hover:bg-gray-10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {tab === "bopp-mcp" ? <BoppMcpPanel /> : null}
        {tab === "zortout" ? <ZortoutPanel /> : null}
        {tab === "omisell" ? <OmisellPanel /> : null}
      </div>
    </div>
  );
}
