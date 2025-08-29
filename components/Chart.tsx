"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OhlcvCandle, BollingerOptions } from "@/lib/types";
import { DEFAULT_BOLLINGER_INPUTS, DEFAULT_BOLLINGER_STYLE } from "@/lib/types";
import { computeBollingerBands } from "@/lib/indicators/bollinger";
import {
  init,
  dispose,
  registerIndicator,
  IndicatorSeries,
  type IndicatorTemplate,
  type Chart,
  type IndicatorCreate,
  type KLineData,
} from "klinecharts";

type ChartProps = {
  dataUrl?: string;
  enabled: boolean;
  options: BollingerOptions;
  onChartReady?: (chart: Chart) => void;
};

let indicatorRegistered = false;

function ensureRegisterIndicator() {
  if (indicatorRegistered) return;
  const indicator: IndicatorTemplate<
    { basis?: number; upper?: number; lower?: number; timestamp?: number },
    number,
    { style: BollingerOptions["style"] }
  > = {
    name: "FS_BOLL",
    shortName: "BOLL",
    series: IndicatorSeries.Price,
    precision: 2,
    calcParams: [20, 2, 0],
    extendData: { style: DEFAULT_BOLLINGER_STYLE },
    visible: true,
    shouldOhlc: false,
    shouldFormatBigNumber: false,
    figures: [],
    createTooltipDataSource: ({ indicator, crosshair }) => {
      const idx = (crosshair as unknown as { dataIndex?: number } | undefined)?.dataIndex ?? -1;
      const res = (indicator.result[idx] ?? {}) as { basis?: number; upper?: number; lower?: number };
      const name = "BOLL";
      const calcParamsText = `(${indicator.calcParams[0]}, ${indicator.calcParams[1]}, ${indicator.calcParams[2]})`;
      const legends = [
        {
          title: { text: "Basis:", color: "#9ca3af" },
          value: { text: `${res.basis ?? "-"}`, color: "#9ca3af" },
        },
        {
          title: { text: "Upper:", color: "#22d3ee" },
          value: { text: `${res.upper ?? "-"}`, color: "#22d3ee" },
        },
        {
          title: { text: "Lower:", color: "#22d3ee" },
          value: { text: `${res.lower ?? "-"}`, color: "#22d3ee" },
        },
      ];
      return { name, calcParamsText, features: [], legends } as unknown as ReturnType<NonNullable<typeof indicator.createTooltipDataSource>>;
    },
    calc: (dataList, indicator) => {
      const length = Number((indicator as unknown as { calcParams: number[] }).calcParams?.[0] ?? 20);
      const mult = Number((indicator as unknown as { calcParams: number[] }).calcParams?.[1] ?? 2);
      const offset = Number((indicator as unknown as { calcParams: number[] }).calcParams?.[2] ?? 0);
      const bands = computeBollingerBands(
        dataList as unknown as OhlcvCandle[],
        { length, stdDevMultiplier: mult, offset }
      );
      return bands.map((b) => ({ basis: b.basis ?? undefined, upper: b.upper ?? undefined, lower: b.lower ?? undefined, timestamp: b.timestamp }));
    },
    draw: ({ ctx, chart, indicator }) => {
      const style = (indicator.extendData as { style?: BollingerOptions["style"] } | null | undefined)?.style ?? DEFAULT_BOLLINGER_STYLE;
      const range = chart.getVisibleRange();
      const dataList = chart.getDataList() as KLineData[];
      const from = Math.max(0, (range as unknown as { from: number }).from);
      const to = Math.min(dataList.length - 1, (range as unknown as { to: number }).to);
      if (from > to) return true;

      const upperPoints: Array<{ timestamp: number; value: number }> = [];
      const lowerPoints: Array<{ timestamp: number; value: number }> = [];
      const basisPoints: Array<{ timestamp: number; value: number }> = [];
      for (let i = from; i <= to; i++) {
        const r = indicator.result[i] as { upper?: number; lower?: number; basis?: number } | undefined;
        const d = dataList[i] as KLineData;
        if (r?.upper != null) upperPoints.push({ timestamp: d.timestamp, value: r.upper });
        if (r?.lower != null) lowerPoints.push({ timestamp: d.timestamp, value: r.lower });
        if (r?.basis != null) basisPoints.push({ timestamp: d.timestamp, value: r.basis });
      }

      function toCoords(points: Array<{ timestamp: number; value: number }>) {
        return chart.convertToPixel(points.map((p) => ({ timestamp: p.timestamp, value: p.value })), { absolute: true }) as Array<{ x: number; y: number }>;
      }

      const upperCoords = toCoords(upperPoints);
      const lowerCoords = toCoords(lowerPoints);
      const basisCoords = toCoords(basisPoints);

      function setLineStyle(color: string, width: number, dashed: boolean) {
        ctx.strokeStyle = color as unknown as CanvasGradient;
        ctx.lineWidth = Math.max(1, width);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        (ctx as unknown as CanvasRenderingContext2D & { setLineDash?: (v: number[]) => void }).setLineDash?.(dashed ? [6, 4] : []);
      }

      if (style.background.visible && upperCoords.length > 1 && lowerCoords.length > 1) {
        const fillColor = style.background.color ?? style.upper.color;
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, style.background.opacity));
        ctx.fillStyle = fillColor as unknown as CanvasGradient;
        ctx.beginPath();
        for (let i = 0; i < upperCoords.length; i++) {
          const p = upperCoords[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        for (let i = lowerCoords.length - 1; i >= 0; i--) {
          const p = lowerCoords[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (style.upper.visible && upperCoords.length > 1) {
        ctx.save();
        setLineStyle(style.upper.color, style.upper.width, style.upper.style === "dashed");
        ctx.beginPath();
        upperCoords.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.restore();
      }

      if (style.lower.visible && lowerCoords.length > 1) {
        ctx.save();
        setLineStyle(style.lower.color, style.lower.width, style.lower.style === "dashed");
        ctx.beginPath();
        lowerCoords.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.restore();
      }

      if (style.basis.visible && basisCoords.length > 1) {
        ctx.save();
        setLineStyle(style.basis.color, style.basis.width, style.basis.style === "dashed");
        ctx.beginPath();
        basisCoords.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.restore();
      }
      return true;
    },
  };
  registerIndicator(indicator);
  indicatorRegistered = true;
}

export default function ChartCmp({ dataUrl = "/data/ohlcv.json", enabled, options, onChartReady }: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const indicatorIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const mergedOptions = useMemo(() => {
    return {
      inputs: { ...DEFAULT_BOLLINGER_INPUTS, ...options.inputs },
      style: { ...DEFAULT_BOLLINGER_STYLE, ...options.style },
    } as BollingerOptions;
  }, [options]);

  useEffect(() => {
    ensureRegisterIndicator();
    if (!containerRef.current) return;
    const el = containerRef.current;
    const chartMaybe = init(el);
    if (!chartMaybe) return;
    const chart = chartMaybe as Chart;
    chartRef.current = chart;
    onChartReady?.(chart);

    const aborted = false;
    fetch(dataUrl)
      .then((r) => r.json())
      .then((data: OhlcvCandle[]) => {
        if (aborted) return;
        let list = data;
        // Ensure at least 200 candles for smooth performance testing
        if (list.length < 200) {
          const generated: OhlcvCandle[] = [...list];
          let last = list[list.length - 1] ?? {
            timestamp: Date.now() - 200 * 60_000,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 1000,
          };
          const target = 220;
          for (let i = list.length; i < target; i++) {
            const ts = last.timestamp + 60_000;
            const drift = (Math.sin(i / 12) + Math.cos(i / 18)) * 0.3;
            const close = Math.max(1, last.close + drift);
            const open = last.close;
            const high = Math.max(open, close) + Math.random() * 0.6;
            const low = Math.min(open, close) - Math.random() * 0.6;
            const volume = Math.max(500, Math.round((last.volume ?? 1000) * (0.95 + Math.random() * 0.1)));
            const candle: OhlcvCandle = { timestamp: ts, open, high, low, close, volume };
            generated.push(candle);
            last = candle;
          }
          list = generated;
        }
        chart.applyNewData(list as unknown as KLineData[]);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    return () => {
      if (el) dispose(el);
      chartRef.current = null;
      indicatorIdRef.current = null;
    };
  }, [dataUrl, onChartReady]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !loaded) return;
    if (enabled && !indicatorIdRef.current) {
      const id = chart.createIndicator({
        name: "FS_BOLL",
        series: IndicatorSeries.Price,
        calcParams: [
          mergedOptions.inputs.length,
          mergedOptions.inputs.stdDevMultiplier,
          mergedOptions.inputs.offset,
        ],
        extendData: { style: mergedOptions.style },
        visible: true,
      } as IndicatorCreate, false, { id: "candle_pane" });
      indicatorIdRef.current = (id as string) ?? null;
    }
    if (!enabled && indicatorIdRef.current) {
      chart.removeIndicator({ id: indicatorIdRef.current });
      indicatorIdRef.current = null;
    }
  }, [enabled, loaded, mergedOptions]);

  useEffect(() => {
    const chart = chartRef.current;
    const indicatorId = indicatorIdRef.current;
    if (!chart || !indicatorId) return;
    chart.overrideIndicator({
      name: "FS_BOLL",
      id: indicatorId,
      calcParams: [
        mergedOptions.inputs.length,
        mergedOptions.inputs.stdDevMultiplier,
        mergedOptions.inputs.offset,
      ],
      extendData: { style: mergedOptions.style },
      visible: true,
    });
  }, [mergedOptions]);

  return (
    <div className="w-full h-[520px] bg-black/90 rounded-md border border-white/10">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

