import React from "react";
import { TH } from "../theme";

export function Row({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"3px 0" }}>
      <span>{k}</span><span style={{ color:TH.text }}>{v}</span>
    </div>
  );
}

export default Row;
