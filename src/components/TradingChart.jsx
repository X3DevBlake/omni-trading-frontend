import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, LineStyle } from "lightweight-charts";
import { TH } from "../theme";

export function TradingChart({ candles = [], height = 460, showVolume = true }) {
  const container = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma50Ref = useRef(null);

  const [chartType, setChartType] = useState("candles");
  const [showMA, setShowMA] = useState(true);
  const [hover, setHover] = useState(null);

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
        vertLines: { color: "rgba(124,200,255,0.05)" },
        horzLines: { color: "rgba(124,200,255,0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: TH.cyan, width: 1, style: LineStyle.Dashed, labelBackgroundColor: TH.cyan },
        horzLine: { color: TH.cyan, width: 1, style: LineStyle.Dashed, labelBackgroundColor: TH.cyan },
      },
      rightPriceScale: {
        borderColor: "rgba(124,200,255,0.12)",
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.24 : 0.04 },
      },
      timeScale: {
        borderColor: "rgba(124,200,255,0.12)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
      },
    });

    let main;
    if (chartType === "candles") {
      main = chart.addCandlestickSeries({
        upColor: TH.green, downColor: TH.red,
        wickUpColor: TH.green, wickDownColor: TH.red,
        borderVisible: false,
      });
    } else if (chartType === "line") {
      main = chart.addLineSeries({ color: TH.cyan, lineWidth: 2 });
    } else {
      main = chart.addAreaSeries({
        lineColor: TH.cyan,
        topColor: "rgba(124,200,255,0.35)",
        bottomColor: "rgba(124,200,255,0.02)",
        lineWidth: 2,
      });
    }
    mainSeriesRef.current = main;

    if (showVolume) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "",
        color: "rgba(124,200,255,0.3)",
      });
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeSeriesRef.current = volSeries;
    }

    if (showMA) {
      ma20Ref.current = chart.addLineSeries({
        color: TH.gold, lineWidth: 1,
        lastValueVisible: false, priceLineVisible: false, title: "MA20",
      });
      ma50Ref.current = chart.addLineSeries({
        color: TH.magenta, lineWidth: 1,
        lastValueVisible: false, priceLineVisible: false, title: "MA50",
      });
    }

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.point || param.point.x < 0) { setHover(null); return; }
      const mainData = param.seriesData.get(mainSeriesRef.current);
      const volData = volumeSeriesRef.current
        ? param.seriesData.get(volumeSeriesRef.current)
        : null;
      if (!mainData) { setHover(null); return; }
      setHover({
        time: param.time,
        open: mainData.open, high: mainData.high, low: mainData.low,
        close: mainData.close ?? mainData.value,
        volume: volData?.value,
      });
    });

    chartRef.current = chart;

    return () => {
      try { chart.remove(); } catch (_) {}
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma20Ref.current = null;
      ma50Ref.current = null;
    };
  }, [chartType, showVolume, showMA]);

  useEffect(() => {
    if (!mainSeriesRef.current || !candles?.length) return;

    if (chartType === "candles") {
      mainSeriesRef.current.setData(
        candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
      );
    } else {
      mainSeriesRef.current.setData(candles.map(c => ({ time: c.time, value: c.close })));
    }

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        candles.map(c => ({
          time: c.time, value: c.volume,
          color: c.close >= c.open ? "rgba(74,222,160,0.45)" : "rgba(255,106,133,0.45)",
        }))
      );
    }

    if (showMA && ma20Ref.current && ma50Ref.current) {
      ma20Ref.current.setData(movingAverage(candles, 20));
      ma50Ref.current.setData(movingAverage(candles, 50));
    }
  }, [candles, chartType, showMA]);

  const typeBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setChartType(key)}
      style={{
        padding: "4px 10px",
        background: chartType === key ? `${TH.cyan}22` : "transparent",
        border: `1px solid ${chartType === key ? TH.cyan : TH.border}`,
        color: chartType === key ? TH.cyan : TH.dim,
        borderRadius: 6, fontSize: 10, fontFamily: TH.mono,
        letterSpacing: "0.1em", cursor: "pointer",
      }}
    >{label}</button>
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        {typeBtn("candles", "CANDLES")}
        {typeBtn("line", "LINE")}
        {typeBtn("area", "AREA")}
        <div style={{ width: 10 }} />
        <button
          onClick={() => setShowMA(v => !v)}
          style={{
            padding: "4px 10px",
            background: showMA ? `${TH.gold}18` : "transparent",
            border: `1px solid ${showMA ? TH.gold : TH.border}`,
            color: showMA ? TH.gold : TH.dim,
            borderRadius: 6, fontSize: 10, fontFamily: TH.mono,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
        >MA {showMA ? "ON" : "OFF"}</button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => chartRef.current?.timeScale().fitContent()}
          style={{
            padding: "4px 10px", background: "transparent",
            border: `1px solid ${TH.border}`, color: TH.dim,
            borderRadius: 6, fontSize: 10, fontFamily: TH.mono,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
        >FIT</button>
      </div>

      {hover && (
        <div style={{
          position: "absolute", top: 46, left: 14, zIndex: 3,
          padding: "6px 10px", background: "rgba(3,6,17,0.9)",
          border: `1px solid ${TH.border}`, borderRadius: 6,
          fontSize: 10, fontFamily: TH.mono, color: TH.text,
          letterSpacing: "0.05em", pointerEvents: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}>
          <span style={{ color: TH.dim }}>O</span> {fmt(hover.open)}
          <span style={{ color: TH.dim, marginLeft: 8 }}>H</span> {fmt(hover.high)}
          <span style={{ color: TH.dim, marginLeft: 8 }}>L</span> {fmt(hover.low)}
          <span style={{ color: TH.dim, marginLeft: 8 }}>C</span>{" "}
          <span style={{ color: hover.close >= hover.open ? TH.green : TH.red }}>{fmt(hover.close)}</span>
          {hover.volume != null && (
            <><span style={{ color: TH.dim, marginLeft: 8 }}>V</span> {fmtVol(hover.volume)}</>
          )}
        </div>
      )}

      <div
        ref={container}
        style={{
          width: "100%", height,
          borderRadius: 12,
          border: `1px solid ${TH.border}`,
          background: "rgba(3,6,17,0.5)",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

function movingAverage(candles, period) {
  if (candles.length < period) return [];
  const result = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

function fmt(v) {
  if (v == null || !isFinite(v)) return "—";
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(4);
}
function fmtVol(v) {
  if (v == null || !isFinite(v)) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
  return v.toFixed(0);
}

export default TradingChart;
