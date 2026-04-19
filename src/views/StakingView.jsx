import React, { useState, useMemo } from "react";
import { Lock, Unlock, Coins, Zap, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { useStaking, LOCK_TIERS, formatDuration } from "../hooks/useStaking";
import { TH } from "../theme";
import { fmtUsd } from "../lib/formatters";

export function StakingView({ connected, account }) {
  const staking = useStaking(account?.fullAddress);
  const [amount, setAmount] = useState("500");
  const [selectedTier, setSelectedTier] = useState("90d");
  const [flash, setFlash] = useState(null);

  const tier = LOCK_TIERS.find(t => t.id === selectedTier);
  const parsedAmount = parseFloat(amount) || 0;
  const yearlyEst = parsedAmount * (tier?.apr || 0);
  const yearlyEstUsd = yearlyEst * staking.omniPrice;

  const handleStake = () => {
    setFlash(null);
    try {
      staking.stake(parsedAmount, selectedTier);
      setFlash({ type: "ok", msg: `Staked ${parsedAmount} OMNI at ${(tier.apr * 100).toFixed(0)}% APR` });
      setAmount("");
    } catch (err) {
      setFlash({ type: "error", msg: err.message });
    }
  };

  const handleUnstake = (pos) => {
    if (pos.isLocked && !confirm(
      `This position is locked for ${formatDuration(pos.remainingMs)}. ` +
      `Early unstake forfeits 50% of your ${pos.accrued.toFixed(2)} OMNI rewards. Continue?`
    )) return;
    staking.unstake(pos.id);
    setFlash({ type: "ok", msg: `Unstaked ${pos.amount.toFixed(2)} OMNI` });
  };

  const handleClaim = () => {
    if (staking.totalAccrued <= 0) {
      setFlash({ type: "error", msg: "Nothing to claim yet." });
      return;
    }
    const amount = staking.totalAccrued;
    staking.claimAll();
    setFlash({ type: "ok", msg: `Claimed ${amount.toFixed(4)} OMNI` });
  };

  return (
    <div>
      {/* Header hero */}
      <div className="glass" style={{
        padding: 24, borderRadius: 16, marginBottom: 16,
        background: `linear-gradient(135deg,rgba(124,200,255,0.12),rgba(176,137,255,0.08))`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle shimmer pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.12,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${TH.cyan} 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, ${TH.magenta} 0%, transparent 50%)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, position: "relative" }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: `linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 24px ${TH.cyan}55`,
          }}>
            <Lock size={26} color="#000" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.2em", marginBottom: 2 }}>
              OMNI · STAKING
            </div>
            <div style={{ fontFamily: TH.display, fontSize: 24, letterSpacing: "0.1em", fontWeight: 900 }}>
              sOMNI
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.2em" }}>OMNI PRICE</div>
            <div style={{ fontSize: 16, fontFamily: TH.mono, fontWeight: 700, color: TH.text }}>
              {fmtUsd(staking.omniPrice)}
            </div>
          </div>
        </div>

        {/* Top stat strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 14, position: "relative",
        }}>
          <StatTile label="AVAILABLE" value={fmtNum(staking.balance)} unit="OMNI" color={TH.text} />
          <StatTile label="STAKED" value={fmtNum(staking.totalStaked)} unit="OMNI" color={TH.cyan} />
          <StatTile
            label="EARNING"
            value={fmtNum(staking.totalAccrued, 4)}
            unit="OMNI"
            color={TH.green}
            glow
          />
          <StatTile label="APR (WEIGHTED)" value={(staking.weightedApr * 100).toFixed(1)} unit="%" color={TH.gold} />
          <StatTile label="VOTING POWER" value={fmtNum(staking.votingPower)} unit="veOMNI" color={TH.magenta} />
        </div>
      </div>

      {/* Stake form + tier selector */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px,1fr) minmax(320px,1fr)",
        gap: 14, marginBottom: 16,
      }}>
        {/* Stake form */}
        <div className="glass" style={{ padding: 20, borderRadius: 14 }}>
          <div style={{ fontFamily: TH.display, fontSize: 13, letterSpacing: "0.15em", color: TH.dim, marginBottom: 14 }}>
            STAKE OMNI
          </div>

          {/* Amount input */}
          <div style={{
            padding: 14, background: "rgba(0,0,0,0.3)", border: `1px solid ${TH.border}`,
            borderRadius: 12, marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TH.dim, marginBottom: 8 }}>
              <span>AMOUNT</span>
              <button
                onClick={() => setAmount(String(staking.balance))}
                style={{
                  background: "none", border: "none", color: TH.cyan,
                  fontSize: 10, fontFamily: TH.mono, cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >MAX {fmtNum(staking.balance)}</button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: TH.text, fontSize: 24, fontFamily: TH.mono,
                  fontWeight: 700, outline: "none",
                }}
              />
              <span style={{ fontFamily: TH.display, fontSize: 14, color: TH.dim, letterSpacing: "0.15em" }}>
                OMNI
              </span>
            </div>
            <div style={{ fontSize: 11, color: TH.dim, fontFamily: TH.mono, marginTop: 4 }}>
              ≈ {fmtUsd(parsedAmount * staking.omniPrice)}
            </div>
          </div>

          {/* Tier picker */}
          <div style={{ fontSize: 10, color: TH.dim, marginBottom: 6, letterSpacing: "0.15em" }}>LOCK PERIOD</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, marginBottom: 12 }}>
            {LOCK_TIERS.map(t => {
              const isSelected = selectedTier === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  style={{
                    padding: "10px 12px", textAlign: "left", cursor: "pointer",
                    background: isSelected ? `${TH.cyan}18` : "rgba(0,0,0,0.25)",
                    border: `1px solid ${isSelected ? TH.cyan : TH.border}`,
                    borderRadius: 8, color: TH.text,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    fontFamily: TH.display, fontSize: 11, letterSpacing: "0.1em",
                    color: isSelected ? TH.cyan : TH.text,
                  }}>{t.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? TH.cyan : TH.text, fontFamily: TH.mono }}>
                    {(t.apr * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 9, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.12em" }}>
                    {t.multiplier}× VOTES
                  </div>
                </button>
              );
            })}
          </div>

          {/* Estimate + flash */}
          <div style={{
            padding: "10px 12px", borderRadius: 8, marginBottom: 10,
            background: "rgba(0,0,0,0.25)", border: `1px solid ${TH.border}`,
            fontSize: 11, fontFamily: TH.mono, color: TH.dim, lineHeight: 1.8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Yearly reward estimate</span>
              <span style={{ color: TH.green, fontWeight: 700 }}>
                +{fmtNum(yearlyEst, 2)} OMNI
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>In USD</span>
              <span style={{ color: TH.text }}>≈ {fmtUsd(yearlyEstUsd)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Voting power</span>
              <span style={{ color: TH.magenta }}>
                {fmtNum(parsedAmount * (tier?.multiplier || 1), 2)} veOMNI
              </span>
            </div>
          </div>

          {flash && (
            <div style={{
              padding: "8px 12px", marginBottom: 10, borderRadius: 8,
              fontSize: 11, fontFamily: TH.mono,
              background: flash.type === "error" ? `${TH.red}18` : `${TH.green}18`,
              border: `1px solid ${flash.type === "error" ? TH.red : TH.green}55`,
              color: flash.type === "error" ? TH.red : TH.green,
            }}>{flash.msg}</div>
          )}

          <button
            onClick={handleStake}
            disabled={parsedAmount <= 0 || parsedAmount > staking.balance}
            style={{
              width: "100%", padding: 12, borderRadius: 10,
              background: parsedAmount > 0 && parsedAmount <= staking.balance
                ? `linear-gradient(135deg,${TH.cyan},${TH.magenta})`
                : "rgba(255,255,255,0.05)",
              color: parsedAmount > 0 && parsedAmount <= staking.balance ? "#000" : TH.dim,
              border: "none",
              cursor: parsedAmount > 0 && parsedAmount <= staking.balance ? "pointer" : "not-allowed",
              fontFamily: TH.display, fontSize: 13, fontWeight: 900,
              letterSpacing: "0.2em",
              boxShadow: parsedAmount > 0 ? `0 4px 20px ${TH.cyan}55` : "none",
              transition: "all 0.15s",
            }}
          >
            STAKE {tier?.label}
          </button>
        </div>

        {/* Claim + Info panel */}
        <div className="glass" style={{
          padding: 20, borderRadius: 14,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontFamily: TH.display, fontSize: 13, letterSpacing: "0.15em", color: TH.dim, marginBottom: 14 }}>
            CLAIM REWARDS
          </div>

          <div style={{
            padding: 20, borderRadius: 12,
            background: `linear-gradient(135deg,${TH.green}14,${TH.green}04)`,
            border: `1px solid ${TH.green}55`,
            textAlign: "center", marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.2em", marginBottom: 6 }}>
              PENDING REWARDS
            </div>
            <div style={{
              fontSize: 34, fontFamily: TH.mono, fontWeight: 900, color: TH.green,
              textShadow: `0 0 16px ${TH.green}`, marginBottom: 4,
            }}>
              +{fmtNum(staking.totalAccrued, 6)}
            </div>
            <div style={{ fontSize: 11, color: TH.dim, fontFamily: TH.mono }}>
              OMNI · ≈ {fmtUsd(staking.totalAccrued * staking.omniPrice)}
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={staking.totalAccrued <= 0}
            style={{
              width: "100%", padding: 12, borderRadius: 10,
              background: staking.totalAccrued > 0 ? TH.green : "rgba(255,255,255,0.05)",
              color: staking.totalAccrued > 0 ? "#000" : TH.dim,
              border: "none",
              cursor: staking.totalAccrued > 0 ? "pointer" : "not-allowed",
              fontFamily: TH.display, fontSize: 13, fontWeight: 900,
              letterSpacing: "0.2em",
              boxShadow: staking.totalAccrued > 0 ? `0 4px 20px ${TH.green}55` : "none",
            }}
          >
            CLAIM ALL REWARDS
          </button>

          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: `1px solid ${TH.border}`,
            fontSize: 11, fontFamily: TH.mono, color: TH.dim, lineHeight: 1.8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Lifetime claimed</span>
              <span style={{ color: TH.text }}>{fmtNum(staking.claimedLifetime, 4)} OMNI</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Positions open</span>
              <span style={{ color: TH.text }}>{staking.positions.length}</span>
            </div>
          </div>

          <div style={{
            marginTop: "auto", paddingTop: 12, fontSize: 10, color: TH.muted,
            fontFamily: TH.mono, letterSpacing: "0.12em", textAlign: "center",
          }}>
            CLAIMING RESETS ACCRUAL · NO UNSTAKE PENALTY
          </div>
        </div>
      </div>

      {/* Open positions */}
      <div className="glass" style={{ padding: 18, borderRadius: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Coins size={16} color={TH.cyan} />
          <h3 style={{ margin: 0, fontFamily: TH.display, fontSize: 14, letterSpacing: "0.15em" }}>
            OPEN POSITIONS
          </h3>
          <span style={{
            fontSize: 10, fontFamily: TH.mono, letterSpacing: "0.15em",
            color: TH.dim, padding: "2px 8px", borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
          }}>{staking.positions.length}</span>
        </div>

        {staking.positions.length === 0 ? (
          <div style={{
            padding: 24, textAlign: "center", color: TH.dim, fontSize: 12,
            fontFamily: TH.mono, letterSpacing: "0.1em",
          }}>
            No positions yet. Stake above to start earning.
          </div>
        ) : (
          staking.positions.map(p => (
            <PositionRow key={p.id} p={p} omniPrice={staking.omniPrice} onUnstake={() => handleUnstake(p)} />
          ))
        )}
      </div>

      {/* Closed positions history */}
      {staking.closedPositions.length > 0 && (
        <div className="glass" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Clock size={14} color={TH.dim} />
            <h3 style={{ margin: 0, fontFamily: TH.display, fontSize: 13, letterSpacing: "0.15em", color: TH.dim }}>
              HISTORY
            </h3>
          </div>
          {staking.closedPositions.slice(0, 20).map(p => {
            const t = LOCK_TIERS.find(x => x.id === p.tierId) || LOCK_TIERS[0];
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 0", borderBottom: `1px solid ${TH.border}`,
                fontSize: 12, fontFamily: TH.mono,
              }}>
                <span style={{ flex: 1 }}>
                  {fmtNum(p.amount)} OMNI · {t.label}
                  {p.earlyExit && (
                    <span style={{ color: TH.red, marginLeft: 8, fontSize: 10 }}>
                      EARLY EXIT (50% penalty)
                    </span>
                  )}
                </span>
                <span style={{
                  color: (p.finalRewards || 0) > 0 ? TH.green : TH.dim,
                  fontWeight: 700,
                }}>
                  +{fmtNum(p.finalRewards || 0, 4)} OMNI
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Developer note */}
      <div style={{
        marginTop: 14, padding: "12px 16px", borderRadius: 10,
        background: "rgba(0,0,0,0.25)", border: `1px solid ${TH.border}`,
        fontSize: 11, color: TH.dim, lineHeight: 1.7,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <AlertCircle size={14} color={TH.gold} style={{ marginTop: 2, flexShrink: 0 }} />
        <span>
          <strong style={{ color: TH.text }}>Simulation:</strong> sOMNI is not a
          real deployed token. Stakes, rewards, and balances are stored in your
          browser's local storage. Reset anytime.
          {!connected && " Connect a wallet to persist stakes per address."}
        </span>
      </div>
    </div>
  );
}

// ─── Position row ──────────────────────────────────────────────────────
function PositionRow({ p, omniPrice, onUnstake }) {
  const lockBar = p.isLocked
    ? Math.max(0, 1 - p.remainingMs / (p.unlocksAt - p.startedAt))
    : 1;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto auto",
      gap: 12, alignItems: "center",
      padding: "12px 0", borderBottom: `1px solid ${TH.border}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: p.isLocked
          ? `${TH.cyan}14`
          : `${TH.green}14`,
        border: `1px solid ${p.isLocked ? TH.cyan : TH.green}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {p.isLocked
          ? <Lock size={14} color={TH.cyan} />
          : <Unlock size={14} color={TH.green} />}
      </div>

      <div>
        <div style={{ fontWeight: 700, fontFamily: TH.mono, fontSize: 13 }}>
          {fmtNum(p.amount)} OMNI
          <span style={{
            marginLeft: 8, fontSize: 9, padding: "2px 6px", borderRadius: 4,
            background: "rgba(255,255,255,0.06)", color: TH.dim,
            letterSpacing: "0.15em", fontFamily: TH.display,
          }}>
            {p.tier.label} · {(p.tier.apr * 100).toFixed(0)}%
          </span>
        </div>
        {p.isLocked ? (
          <div style={{ marginTop: 6 }}>
            <div style={{
              height: 3, width: "100%", borderRadius: 2,
              background: "rgba(255,255,255,0.07)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${lockBar * 100}%`,
                background: `linear-gradient(90deg,${TH.cyan},${TH.magenta})`,
                transition: "width 1s linear",
              }} />
            </div>
            <div style={{ fontSize: 10, color: TH.dim, fontFamily: TH.mono, marginTop: 3, letterSpacing: "0.05em" }}>
              UNLOCKS IN {formatDuration(p.remainingMs)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: TH.green, fontFamily: TH.mono, marginTop: 3, letterSpacing: "0.1em" }}>
            UNLOCKED · WITHDRAWABLE
          </div>
        )}
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 9, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.15em" }}>ACCRUED</div>
        <div style={{
          fontSize: 12, fontWeight: 700, fontFamily: TH.mono, color: TH.green,
          textShadow: `0 0 8px ${TH.green}40`,
        }}>
          +{fmtNum(p.accrued, 4)}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 9, color: TH.dim, fontFamily: TH.mono, letterSpacing: "0.15em" }}>VALUE</div>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: TH.mono }}>
          {fmtUsd((p.amount + p.accrued) * omniPrice)}
        </div>
      </div>

      <button
        onClick={onUnstake}
        style={{
          padding: "6px 12px", fontSize: 10, fontFamily: TH.mono,
          background: p.isLocked ? `${TH.red}18` : `${TH.green}18`,
          border: `1px solid ${p.isLocked ? TH.red : TH.green}55`,
          color: p.isLocked ? TH.red : TH.green,
          borderRadius: 6, cursor: "pointer", letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        {p.isLocked ? "EARLY EXIT" : "UNSTAKE"}
      </button>
    </div>
  );
}

// ─── Stat tile ──────────────────────────────────────────────────────────
function StatTile({ label, value, unit, color, glow }) {
  return (
    <div>
      <div style={{
        fontSize: 9, color: TH.dim, fontFamily: TH.mono,
        letterSpacing: "0.2em", marginBottom: 2,
      }}>{label}</div>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6,
      }}>
        <div style={{
          fontSize: 20, fontFamily: TH.mono, fontWeight: 700,
          color,
          textShadow: glow ? `0 0 14px ${color}66` : "none",
          fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        <div style={{
          fontSize: 10, fontFamily: TH.mono, color: TH.dim,
          letterSpacing: "0.12em",
        }}>{unit}</div>
      </div>
    </div>
  );
}

// Compact number formatter
function fmtNum(v, decimals = 2) {
  if (v == null || !isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (Math.abs(v) >= 10_000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Math.abs(v) >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: decimals });
  return v.toFixed(decimals);
}

export default StakingView;
