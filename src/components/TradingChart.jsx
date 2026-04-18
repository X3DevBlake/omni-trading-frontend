import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { TH } from "../theme.js";

/**
 * Interactive real-time candlestick chart.
 *
 * Props:
 *   candles:  [{ time, open, high, low, close, volume }, ...]
 *   height?:  px height (default 420)
 *   showVolume?: boolean (default true)
 */
export function TradingChart({ candles = [], height = 420, showVolume = true }) {
  const container = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // One-time chart creation
  useEffect(() => {
    if (!container.current) return;

    const chart = createChart(container.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: TH.dim,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: "rgba(124,200,255,0.06)" },
        horzLines: { color: "rgba(124,200,255,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: TH.cyan, width: 1, style: 2, labelBackgroundColor: TH.cyan },
        horzLine: { color: TH.cyan, width: 1, style: 2, labelBackgroundColor: TH.cyan },
      },
      rightPriceScale: {
        borderColor: "rgba(124,200,255,0.15)",
      },
      timeScale: {
        borderColor: "rgba(124,200,255,0.15)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: TH.green,
      downColor: TH.red,
      wickUpColor: TH.green,
      wickDownColor: TH.red,
      borderVisible: false,
    });
    candleSeriesRef.current = candleSeries;

    if (showVolume) {
      const volSeries = chart.addHistogramSeries({
        color: "rgba(124,200,255,0.3)",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volSeries;
    }

    chartRef.current = chart;

    return () => {
      try { chart.remove(); } catch (_) {}
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [showVolume]);

  // Apply candle updates
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return;

    candleSeriesRef.current.setData(
      candles.map(c => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
      }))
    );

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(74,222,160,0.4)" : "rgba(255,106,133,0.4)",
        }))
      );
    }
  }, [candles]);

  return (
    <div
      ref={container}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        border: `1px solid ${TH.border}`,
        background: "rgba(3,6,17,0.4)",
        overflow: "hidden",
      }}
    />
  );
}

export default TradingChart;
