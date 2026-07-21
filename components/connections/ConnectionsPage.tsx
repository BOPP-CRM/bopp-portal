"use client";

import BoppMcpPanel from "@/components/connections/BoppMcpPanel";
import ZortoutPanel from "@/components/connections/ZortoutPanel";
import OmisellPanel from "./OmisellPanel";
import { useEffect, useState } from "react";

type Tab = "bopp-mcp" | "zortout" | "omisell";

const TABS: { id: Tab; label: string }[] = [
  { id: "bopp-mcp", label: "BOPP MCP" },
  { id: "zortout", label: "Zortout" },
  { id: "omisell", label: "Omisell" },
];

const CONNECTIONS_TAB_KEY = "connections_tab";

function isTab(value: string | null): value is Tab {
  return value === "bopp-mcp" || value === "zortout";
}

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("bopp-mcp");

  useEffect(() => {
    const saved = window.localStorage.getItem(CONNECTIONS_TAB_KEY);
    if (isTab(saved)) {
      setTab(saved);
    }
  }, []);

  const selectTab = (id: Tab) => {
    setTab(id);
    window.localStorage.setItem(CONNECTIONS_TAB_KEY, id);
  };

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
            onClick={() => selectTab(item.id)}
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
