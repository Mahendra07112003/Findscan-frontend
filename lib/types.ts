export type OhlcvCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LineStyleKind = "solid" | "dashed";

export type BollingerInputs = {
  length: number;
  basicMAType: "SMA";
  source: "close";
  stdDevMultiplier: number;
  offset: number;
};

export type BollingerStyle = {
  basis: {
    visible: boolean;
    color: string;
    width: number;
    style: LineStyleKind;
  };
  upper: {
    visible: boolean;
    color: string;
    width: number;
    style: LineStyleKind;
  };
  lower: {
    visible: boolean;
    color: string;
    width: number;
    style: LineStyleKind;
  };
  background: {
    visible: boolean;
    opacity: number;
    color?: string;
  };
};

export type BollingerPoint = {
  timestamp: number;
  basis: number | null;
  upper: number | null;
  lower: number | null;
};

export type BollingerOptions = {
  inputs: BollingerInputs;
  style: BollingerStyle;
};

export const DEFAULT_BOLLINGER_INPUTS: BollingerInputs = {
  length: 20,
  basicMAType: "SMA",
  source: "close",
  stdDevMultiplier: 2,
  offset: 0,
};

export const DEFAULT_BOLLINGER_STYLE: BollingerStyle = {
  basis: { visible: true, color: "#4f46e5", width: 1.5, style: "solid" },
  upper: { visible: true, color: "#22d3ee", width: 1, style: "dashed" },
  lower: { visible: true, color: "#22d3ee", width: 1, style: "dashed" },
  background: { visible: true, opacity: 0.08 },
};

