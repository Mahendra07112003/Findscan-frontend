import { BollingerPoint, OhlcvCandle } from "../types";

function computeSimpleMovingAverage(values: number[], length: number): Array<number | null> {
  if (length <= 0) return values.map(() => null);
  const result: Array<number | null> = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    sum += v;
    if (i >= length) {
      sum -= values[i - length];
    }
    if (i >= length - 1) {
      result[i] = sum / length;
    }
  }
  return result;
}

// Population standard deviation over rolling window
function computeRollingStdDev(values: number[], length: number): Array<number | null> {
  if (length <= 1) return values.map(() => null);
  const result: Array<number | null> = new Array(values.length).fill(null);
  for (let i = length - 1; i < values.length; i++) {
    let mean = 0;
    for (let j = i - length + 1; j <= i; j++) {
      mean += values[j];
    }
    mean /= length;
    let varianceSum = 0;
    for (let j = i - length + 1; j <= i; j++) {
      const diff = values[j] - mean;
      varianceSum += diff * diff;
    }
    const variance = varianceSum / length; // population variance
    result[i] = Math.sqrt(variance);
  }
  return result;
}

function applyOffset<T>(arr: Array<T | null>, offset: number): Array<T | null> {
  if (!offset) return arr.slice();
  const out: Array<T | null> = new Array(arr.length).fill(null);
  for (let i = 0; i < arr.length; i++) {
    const target = i + offset;
    if (target >= 0 && target < arr.length) {
      out[target] = arr[i];
    }
  }
  return out;
}

export type ComputeBollingerParams = {
  length: number;
  stdDevMultiplier: number;
  offset: number;
};

export function computeBollingerBands(
  data: OhlcvCandle[],
  { length, stdDevMultiplier, offset }: ComputeBollingerParams
): BollingerPoint[] {
  const closes = data.map((d) => d.close);
  const basis = computeSimpleMovingAverage(closes, length);
  const stddev = computeRollingStdDev(closes, length);
  const upperRaw: Array<number | null> = new Array(data.length).fill(null);
  const lowerRaw: Array<number | null> = new Array(data.length).fill(null);
  for (let i = 0; i < data.length; i++) {
    const b = basis[i];
    const s = stddev[i];
    if (b != null && s != null) {
      upperRaw[i] = b + stdDevMultiplier * s;
      lowerRaw[i] = b - stdDevMultiplier * s;
    }
  }
  const basisShifted = applyOffset(basis, offset);
  const upperShifted = applyOffset(upperRaw, offset);
  const lowerShifted = applyOffset(lowerRaw, offset);
  return data.map((d, i) => ({
    timestamp: d.timestamp,
    basis: basisShifted[i] ?? null,
    upper: upperShifted[i] ?? null,
    lower: lowerShifted[i] ?? null,
  }));
}

export const BollingerMath = {
  computeSimpleMovingAverage,
  computeRollingStdDev,
  applyOffset,
};

