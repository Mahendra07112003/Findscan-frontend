"use client";

import { useState } from "react";
import type { BollingerOptions, LineStyleKind } from "@/lib/types";
import { DEFAULT_BOLLINGER_INPUTS, DEFAULT_BOLLINGER_STYLE } from "@/lib/types";

type Props = {
  open: boolean;
  value: BollingerOptions;
  onChange: (next: BollingerOptions) => void;
  onClose: () => void;
};

export default function BollingerSettings({ open, value, onChange, onClose }: Props) {
  const [tab, setTab] = useState<"inputs" | "style">("inputs");
  if (!open) return null;
  const v = value ?? { inputs: DEFAULT_BOLLINGER_INPUTS, style: DEFAULT_BOLLINGER_STYLE };

  function update<T extends keyof BollingerOptions>(key: T, val: BollingerOptions[T]) {
    onChange({ ...v, [key]: val });
  }

  function updateInput<K extends keyof typeof v.inputs>(key: K, val: (typeof v.inputs)[K]) {
    update("inputs", { ...v.inputs, [key]: val });
  }

  function updateLine(section: "basis" | "upper" | "lower", changes: Partial<(typeof v.style)[typeof section]>) {
    update("style", { ...v.style, [section]: { ...v.style[section], ...changes } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-neutral-900 text-white w-[560px] max-w-[95vw] rounded-lg shadow-xl border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="font-medium">Bollinger Bands — Settings</div>
          <button className="text-white/70 hover:text-white" onClick={onClose}>✕</button>
        </div>
        <div className="px-4 pt-2">
          <div className="flex gap-2 mb-3">
            <button className={`px-3 py-1 rounded ${tab === "inputs" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setTab("inputs")}>Inputs</button>
            <button className={`px-3 py-1 rounded ${tab === "style" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setTab("style")}>Style</button>
          </div>

          {tab === "inputs" ? (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-between gap-3">
                <span>Length</span>
                <input type="number" className="w-28 bg-neutral-800 rounded px-2 py-1"
                  value={v.inputs.length}
                  min={1}
                  onChange={(e) => updateInput("length", Math.max(1, parseInt(e.target.value || "20", 10)))} />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span>StdDev (multiplier)</span>
                <input type="number" className="w-28 bg-neutral-800 rounded px-2 py-1"
                  value={v.inputs.stdDevMultiplier}
                  step={0.1}
                  onChange={(e) => updateInput("stdDevMultiplier", Number(e.target.value || 2))} />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span>Basic MA Type</span>
                <select className="w-28 bg-neutral-800 rounded px-2 py-1" value={v.inputs.basicMAType} onChange={() => {}}>
                  <option value="SMA">SMA</option>
                </select>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span>Source</span>
                <select className="w-28 bg-neutral-800 rounded px-2 py-1" value={v.inputs.source} onChange={() => {}}>
                  <option value="close">Close</option>
                </select>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span>Offset</span>
                <input type="number" className="w-28 bg-neutral-800 rounded px-2 py-1"
                  value={v.inputs.offset}
                  onChange={(e) => updateInput("offset", parseInt(e.target.value || "0", 10))} />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {(["basis", "upper", "lower"] as const).map((key) => (
                <div key={key} className="grid grid-cols-2 gap-3 items-center">
                  <div className="font-medium capitalize">{key}</div>
                  <label className="flex items-center gap-2 justify-end">
                    <input type="checkbox" checked={v.style[key].visible} onChange={(e) => updateLine(key, { visible: e.target.checked })} />
                    <span className="text-sm text-white/80">Visible</span>
                  </label>
                  <div className="col-span-2 grid grid-cols-4 gap-3 items-center">
                    <label className="flex items-center gap-2">
                      <span className="text-sm w-14">Color</span>
                      <input type="color" value={v.style[key].color} onChange={(e) => updateLine(key, { color: e.target.value })} />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-sm w-14">Width</span>
                      <input type="number" className="w-20 bg-neutral-800 rounded px-2 py-1" value={v.style[key].width}
                        min={1} step={0.5}
                        onChange={(e) => updateLine(key, { width: Number(e.target.value || 1) })} />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-sm w-14">Style</span>
                      <select className="w-24 bg-neutral-800 rounded px-2 py-1"
                        value={v.style[key].style}
                        onChange={(e) => updateLine(key, { style: e.target.value as LineStyleKind })}>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                      </select>
                    </label>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="font-medium">Background fill</div>
                <label className="flex items-center gap-2 justify-end">
                  <input type="checkbox" checked={v.style.background.visible} onChange={(e) => update("style", { ...v.style, background: { ...v.style.background, visible: e.target.checked } })} />
                  <span className="text-sm text-white/80">Visible</span>
                </label>
                <div className="col-span-2 grid grid-cols-4 gap-3 items-center">
                  <label className="flex items-center gap-2">
                    <span className="text-sm w-24">Opacity</span>
                    <input type="range" min={0} max={1} step={0.01} value={v.style.background.opacity}
                      onChange={(e) => update("style", { ...v.style, background: { ...v.style.background, opacity: Number(e.target.value) } })} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

