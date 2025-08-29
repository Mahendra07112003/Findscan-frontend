"use client";
import { useMemo, useState } from "react";
import Chart from "@/components/Chart";
import BollingerSettings from "@/components/BollingerSettings";
import type { BollingerOptions } from "@/lib/types";
import { DEFAULT_BOLLINGER_INPUTS, DEFAULT_BOLLINGER_STYLE } from "@/lib/types";

export default function Home() {
  const [show, setShow] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [options, setOptions] = useState<BollingerOptions>({
    inputs: DEFAULT_BOLLINGER_INPUTS,
    style: DEFAULT_BOLLINGER_STYLE,
  });

  const title = useMemo(() => "FindScan – Bollinger Bands (KLineCharts)", []);

  return (
    <div className="min-h-screen w-full bg-black text-white px-6 py-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/10" onClick={() => setShow((s) => !s)}>
              {show ? "Remove Indicator" : "Add Indicator"}
            </button>
            <button className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/10" onClick={() => setSettingsOpen(true)}>
              Settings
            </button>
          </div>
        </div>
        <Chart enabled={show} options={options} />
      </div>
      <BollingerSettings open={settingsOpen} value={options} onChange={setOptions} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
