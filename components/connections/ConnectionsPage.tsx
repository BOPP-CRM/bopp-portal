"use client";

import BoppMcpPanel from "@/components/connections/BoppMcpPanel";
import LazadaPanel from "@/components/connections/LazadaPanel";
import OpenAiPanel from "@/components/connections/OpenAiPanel";
import ZortoutPanel from "@/components/connections/ZortoutPanel";
import OmisellPanel from "./OmisellPanel";
import FilterGroup, { FilterBar } from "@/components/util/FilterGroup";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = "bopp-mcp" | "zortout" | "omisell" | "lazada" | "openai";

const TABS: { id: Tab; label: string }[] = [
  { id: "bopp-mcp", label: "BOPP MCP" },
  { id: "zortout", label: "Zortout" },
  { id: "omisell", label: "Omisell" },
  { id: "lazada", label: "Lazada" },
  { id: "openai", label: "OpenAI" },
];

const CONNECTIONS_TAB_KEY = "connections_tab";

function isTab(value: string | null): value is Tab {
  return (
    value === "bopp-mcp" ||
    value === "zortout" ||
    value === "omisell" ||
    value === "lazada" ||
    value === "openai"
  );
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("bopp-mcp");

  useEffect(() => {
    const queryTab = searchParams.get("tab");
    if (isTab(queryTab)) {
      setTab(queryTab);
      window.localStorage.setItem(CONNECTIONS_TAB_KEY, queryTab);
      return;
    }

    const saved = window.localStorage.getItem(CONNECTIONS_TAB_KEY);
    if (isTab(saved)) {
      setTab(saved);
    }
  }, [searchParams]);

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

      <FilterBar>
        <FilterGroup
          ariaLabel="การเชื่อมต่อ"
          options={TABS.map((item) => ({ value: item.id, label: item.label }))}
          value={tab}
          onChange={selectTab}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {tab === "bopp-mcp" ? <BoppMcpPanel /> : null}
        {tab === "zortout" ? <ZortoutPanel /> : null}
        {tab === "omisell" ? <OmisellPanel onSwitchToLazada={() => selectTab("lazada")} /> : null}
        {tab === "lazada" ? <LazadaPanel onSwitchToOmisell={() => selectTab("omisell")} /> : null}
        {tab === "openai" ? <OpenAiPanel /> : null}
      </div>
    </div>
  );
}
