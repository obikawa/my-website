import { useState, useMemo } from "react";

// ─── Utilities ───
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getLastDayOfMonth(y, m) { return new Date(y, m + 1, 0); }
function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function daysBetween(a, b) {
  const s = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const e = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((e - s) / 86400000) + 1;
}
function fmtDate(d) { return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; }
function isMonthEnd(d) { return d.getDate() === getDaysInMonth(d.getFullYear(), d.getMonth()); }
function isSameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }

// ─── Analysis ───
function analyzeExemption(p1Start, p1End, p1Work, p2Start, p2End, p2Work) {
  const periods = [];
  if (p1Start && p1End) periods.push({ start: p1Start, end: p1End, workDays: p1Work });
  if (p2Start && p2End) periods.push({ start: p2Start, end: p2End, workDays: p2Work });
  if (periods.length === 0) return null;

  const allMonths = new Set();
  periods.forEach(p => {
    let d = new Date(p.start.getFullYear(), p.start.getMonth(), 1);
    while (d <= p.end) {
      allMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  });

  const monthly = {};
  allMonths.forEach(key => {
    const [year, month] = key.split("-").map(Number);
    const label = `${year}年${month + 1}月`;
    let exempt = false;
    const reasons = [];
    const lastDay = getLastDayOfMonth(year, month);

    const hasMonthEnd = periods.some(p => p.start <= lastDay && p.end >= lastDay);
    if (hasMonthEnd) {
      exempt = true;
      reasons.push("月末日が育休期間に含まれている");
    }

    const sameMonthPeriods = periods.filter(p =>
      isSameMonth(p.start, new Date(year, month, 1)) &&
      isSameMonth(p.end, new Date(year, month, 1))
    );
    if (sameMonthPeriods.length > 0) {
      const mStart = new Date(year, month, 1);
      const mEnd = getLastDayOfMonth(year, month);
      let total = 0;
      sameMonthPeriods.forEach(p => {
        const es = p.start > mStart ? p.start : mStart;
        const ee = p.end < mEnd ? p.end : mEnd;
        if (es <= ee) total += daysBetween(es, ee) - p.workDays;
      });
      total = Math.max(0, total);
      if (total >= 14 && !exempt) {
        exempt = true;
        reasons.push(`同月内の育休日数が${total}日（14日以上）`);
      } else if (total >= 14 && exempt) {
        reasons.push(`同月内の育休日数も${total}日（14日以上）で条件充足`);
      } else if (!exempt) {
        reasons.push(`同月内の育休日数は${total}日（14日未満のため免除対象外）`);
      }
    }

    if (!exempt && !hasMonthEnd && sameMonthPeriods.length === 0) {
      reasons.push("月末日が育休期間に含まれず、同月内の育休も14日未満");
    }

    monthly[key] = { label, exempt, reasons };
  });

  // Consecutive warning
  const warnings = [];
  if (periods.length === 2) {
    const p1 = periods[0];
    const p2 = periods[1];
    const p1EndsMonthEnd = isMonthEnd(p1.end);
    const p2StartsMonthStart = p2.start.getDate() === 1;
    const consecutive = daysBetween(p1.end, p2.start) === 2;

    if (p1EndsMonthEnd && p2StartsMonthStart && consecutive) {
      warnings.push(
        `1ヶ月目の終了日（${fmtDate(p1.end)}）が月末、2ヶ月目の開始日（${fmtDate(p2.start)}）が翌月初のため、「連続した1つの育休」とみなされる可能性があります。その場合、2ヶ月分の免除にならないことがあります。取得の間に1日以上の出勤日を挟むか、管轄の年金事務所にご確認ください。`
      );
    }
  }

  return { monthly, warnings };
}

// ─── Icons ───
const CheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="11" fill="#10b981" />
    <path d="M6.5 11.5L9.5 14.5L15.5 8.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="11" fill="#ef4444" />
    <path d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// ─── Fixed-Month Calendar Picker ───
function MonthCalendar({ year, month, startDate, endDate, onSelect, accentColor }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  const handleClick = (day) => {
    const clicked = new Date(year, month, day);
    if (!startDate || (startDate && endDate)) {
      onSelect(clicked, null);
    } else if (startDate && !endDate) {
      if (clicked < startDate) {
        onSelect(clicked, null);
      } else {
        onSelect(startDate, clicked);
      }
    }
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const d = new Date(year, month, day);
    return d > startDate && d < endDate;
  };
  const isStart = (day) => startDate && sameDay(new Date(year, month, day), startDate);
  const isEnd = (day) => endDate && sameDay(new Date(year, month, day), endDate);
  const isLastDay = (day) => day === daysInMonth;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{
      background: "white", borderRadius: "14px",
      border: "1px solid #e2e8f0", overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
        textAlign: "center",
        background: `${accentColor}08`,
      }}>
        <span style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
          {year}年{month + 1}月
        </span>
      </div>

      <div style={{
        padding: "8px 16px", fontSize: "11px", color: "#94a3b8",
        textAlign: "center", background: "#f8fafc",
      }}>
        {!startDate ? "開始日をタップ → 終了日をタップ" :
         !endDate ? "終了日をタップしてください" :
         `${fmtDate(startDate)} 〜 ${fmtDate(endDate)}（${daysBetween(startDate, endDate)}日間）`}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        padding: "4px 8px",
      }}>
        {DOW.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", fontSize: "11px", fontWeight: 600,
            color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#94a3b8",
            padding: "4px 0",
          }}>{d}</div>
        ))}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        padding: "0 8px 12px", gap: "2px",
      }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dow = (firstDow + day - 1) % 7;
          const start = isStart(day);
          const end = isEnd(day);
          const inRange = isInRange(day);
          const selected = start || end;
          const monthEnd = isLastDay(day);

          return (
            <div
              key={day}
              onClick={() => handleClick(day)}
              style={{
                position: "relative",
                textAlign: "center",
                padding: "8px 2px",
                fontSize: "14px",
                fontWeight: selected ? 800 : inRange ? 600 : 400,
                color: selected ? "white" :
                       inRange ? accentColor :
                       dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#334155",
                background: selected ? accentColor :
                            inRange ? `${accentColor}18` :
                            "transparent",
                borderRadius: start && end ? "8px" :
                              start ? "8px 0 0 8px" :
                              end ? "0 8px 8px 0" :
                              inRange ? "0" : "8px",
                cursor: "pointer",
                transition: "all 0.1s",
                userSelect: "none",
              }}
            >
              {day}
              {monthEnd && !selected && (
                <div style={{
                  position: "absolute", bottom: "2px", left: "50%",
                  transform: "translateX(-50%)",
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "#f59e0b",
                }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "6px 16px 10px", borderTop: "1px solid #f1f5f9",
        display: "flex", gap: "12px", justifyContent: "center",
      }}>
        <span style={{ fontSize: "10px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: accentColor, display: "inline-block" }} />
          選択日
        </span>
        <span style={{ fontSize: "10px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          月末日
        </span>
      </div>
    </div>
  );
}

// ─── Main ───
export default function ParentalLeaveChecker() {
  const today = new Date();
  const [m1Year, setM1Year] = useState(today.getFullYear());
  const [m1Month, setM1Month] = useState(today.getMonth());
  const [p1Start, setP1Start] = useState(null);
  const [p1End, setP1End] = useState(null);
  const [p1Work, setP1Work] = useState(0);

  const m2Year = m1Month === 11 ? m1Year + 1 : m1Year;
  const m2Month = m1Month === 11 ? 0 : m1Month + 1;

  const [p2Start, setP2Start] = useState(null);
  const [p2End, setP2End] = useState(null);
  const [p2Work, setP2Work] = useState(0);

  const p1Days = p1Start && p1End ? daysBetween(p1Start, p1End) : 0;
  const p2Days = p2Start && p2End ? daysBetween(p2Start, p2End) : 0;
  const totalDays = p1Days + p2Days;
  const isOver28 = totalDays > 28;
  const hasAnyPeriod = p1Days > 0 || p2Days > 0;

  const handleM1Change = (y, m) => {
    setM1Year(y); setM1Month(m);
    setP1Start(null); setP1End(null); setP1Work(0);
    setP2Start(null); setP2End(null); setP2Work(0);
  };

  const results = useMemo(() => {
    if (p1Days === 0) return null;
    if (isOver28) return null;
    return analyzeExemption(p1Start, p1End, p1Work, p2Start, p2End, p2Work);
  }, [p1Start, p1End, p1Work, p2Start, p2End, p2Work, p1Days, isOver28]);

  const sortedResults = useMemo(() => {
    if (!results) return [];
    return Object.entries(results.monthly).sort(([a], [b]) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return ay !== by ? ay - by : am - bm;
    });
  }, [results]);

  const exemptCount = sortedResults.filter(([, v]) => v.exempt).length;
  const totalMonths = sortedResults.length;
  const warnings = results ? results.warnings : [];

  const resetAll = () => {
    setP1Start(null); setP1End(null); setP1Work(0);
    setP2Start(null); setP2End(null); setP2Work(0);
  };

  return (
    <div style={{
      fontFamily: "'Noto Sans JP', sans-serif",
      maxWidth: "640px", margin: "0 auto",
      padding: "20px 0 48px", color: "#1e293b",
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* ── Month selector ── */}
      <div style={{
        background: "white", borderRadius: "14px",
        border: "1px solid #e2e8f0", padding: "16px",
        marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
          対象月を選択
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <button onClick={() => handleM1Change(m1Month === 0 ? m1Year - 1 : m1Year, m1Month === 0 ? 11 : m1Month - 1)}
            style={{
              background: "none", border: "1px solid #e2e8f0", borderRadius: "8px",
              width: "32px", height: "32px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: "#64748b",
            }}>‹</button>
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: "16px", fontWeight: 800, color: "#1e293b",
          }}>
            <span style={{
              background: "#3b82f6", color: "white",
              padding: "4px 12px", borderRadius: "8px",
            }}>{m1Year}年{m1Month + 1}月</span>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>・</span>
            <span style={{
              background: "#8b5cf6", color: "white",
              padding: "4px 12px", borderRadius: "8px",
            }}>{m2Year}年{m2Month + 1}月</span>
          </div>
          <button onClick={() => handleM1Change(m1Month === 11 ? m1Year + 1 : m1Year, m1Month === 11 ? 0 : m1Month + 1)}
            style={{
              background: "none", border: "1px solid #e2e8f0", borderRadius: "8px",
              width: "32px", height: "32px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: "#64748b",
            }}>›</button>
        </div>
      </div>

      {/* ── Day counter ── */}
      <div style={{
        background: isOver28 ? "#fef2f2" : "#f0f9ff",
        border: `1px solid ${isOver28 ? "#fecaca" : "#bae6fd"}`,
        borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontSize: "13px", fontWeight: 600,
          color: isOver28 ? "#dc2626" : "#0369a1",
        }}>
          {isOver28 ? "🚫 上限超過" : "合計取得日数"}
        </span>
        <div>
          <span style={{
            fontSize: "24px", fontWeight: 800,
            color: isOver28 ? "#dc2626" : "#2563eb",
          }}>{totalDays}</span>
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: isOver28 ? "#dc2626" : "#64748b", marginLeft: "2px",
          }}>/ 28日</span>
        </div>
      </div>

      {isOver28 && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
          fontSize: "12px", color: "#dc2626", lineHeight: 1.6,
        }}>
          産後パパ育休は合計28日（4週間）が上限です。現在{totalDays}日で{totalDays - 28}日超過しています。日数を調整してください。
        </div>
      )}

      {/* ── 1ヶ月目 ── */}
      <div style={{
        background: "white", borderRadius: "16px",
        border: "1px solid #e2e8f0", padding: "20px",
        marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "14px",
        }}>
          <div style={{
            fontSize: "15px", fontWeight: 700, margin: 0,
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{
              background: "#3b82f6", color: "white",
              width: "24px", height: "24px", borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700,
            }}>{m1Month + 1}月</span>
            {m1Year}年{m1Month + 1}月の育休
          </div>
          {p1Start && (
            <button onClick={() => { setP1Start(null); setP1End(null); setP1Work(0); }}
              style={{
                background: "none", border: "none", color: "#94a3b8",
                fontSize: "12px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
              }}>リセット</button>
          )}
        </div>

        <MonthCalendar
          year={m1Year} month={m1Month}
          startDate={p1Start} endDate={p1End}
          onSelect={(s, e) => { setP1Start(s); setP1End(e); }}
          accentColor="#3b82f6"
        />

        {p1Start && p1End && (
          <div style={{ marginTop: "12px", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: "#eff6ff", borderRadius: "10px",
              padding: "10px 14px", fontSize: "13px", color: "#1e40af",
              fontWeight: 600, marginBottom: "8px",
            }}>
              {fmtDate(p1Start)} 〜 {fmtDate(p1End)}（{p1Days}日間）
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                うち就業日数
              </label>
              <input type="number" value={p1Work} min={0} max={Math.max(0, p1Days - 1)}
                onChange={e => setP1Work(Math.max(0, Math.min(parseInt(e.target.value) || 0, p1Days - 1)))}
                style={{
                  padding: "6px 8px", border: "2px solid #e2e8f0", borderRadius: "6px",
                  fontSize: "14px", width: "56px", outline: "none",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <span style={{ fontSize: "12px", color: "#64748b" }}>日</span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2ヶ月目 ── */}
      <div style={{
        background: "white", borderRadius: "16px",
        border: "1px solid #e2e8f0", padding: "20px",
        marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "14px",
        }}>
          <div style={{
            fontSize: "15px", fontWeight: 700, margin: 0,
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{
              background: "#8b5cf6", color: "white",
              width: "24px", height: "24px", borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700,
            }}>{m2Month + 1}月</span>
            {m2Year}年{m2Month + 1}月の育休
          </div>
          {p2Start && (
            <button onClick={() => { setP2Start(null); setP2End(null); setP2Work(0); }}
              style={{
                background: "none", border: "none", color: "#94a3b8",
                fontSize: "12px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
              }}>リセット</button>
          )}
        </div>

        {totalDays >= 28 && p2Days === 0 ? (
          <div style={{
            padding: "20px", textAlign: "center", color: "#94a3b8",
            fontSize: "13px", lineHeight: 1.6,
          }}>
            1ヶ月目で28日全てを使用しているため、<br />2ヶ月目の取得はできません
          </div>
        ) : (
          <>
            <MonthCalendar
              year={m2Year} month={m2Month}
              startDate={p2Start} endDate={p2End}
              onSelect={(s, e) => { setP2Start(s); setP2End(e); }}
              accentColor="#8b5cf6"
            />

            {p2Start && p2End && (
              <div style={{ marginTop: "12px", animation: "fadeIn 0.3s ease" }}>
                <div style={{
                  background: "#f5f3ff", borderRadius: "10px",
                  padding: "10px 14px", fontSize: "13px", color: "#5b21b6",
                  fontWeight: 600, marginBottom: "8px",
                }}>
                  {fmtDate(p2Start)} 〜 {fmtDate(p2End)}（{p2Days}日間）
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                    うち就業日数
                  </label>
                  <input type="number" value={p2Work} min={0} max={Math.max(0, p2Days - 1)}
                    onChange={e => setP2Work(Math.max(0, Math.min(parseInt(e.target.value) || 0, p2Days - 1)))}
                    style={{
                      padding: "6px 8px", border: "2px solid #e2e8f0", borderRadius: "6px",
                      fontSize: "14px", width: "56px", outline: "none",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                    onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>日</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Auto results ── */}
      {results && !isOver28 && (
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <div style={{
            background: exemptCount > 0 ? "#ecfdf5" : "#fef2f2",
            border: `2px solid ${exemptCount > 0 ? "#86efac" : "#fca5a5"}`,
            borderRadius: "14px", padding: "20px", marginBottom: "16px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "32px", fontWeight: 800,
              color: exemptCount > 0 ? "#059669" : "#dc2626",
              marginBottom: "4px",
            }}>
              {exemptCount > 0 ? `${exemptCount}ヶ月分 免除` : "免除対象外"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {totalMonths}ヶ月中 {exemptCount}ヶ月の月額保険料が免除されます
            </div>
          </div>

          {warnings.length > 0 && (
            <div style={{
              background: "#fff7ed", border: "2px solid #fb923c",
              borderRadius: "12px", padding: "14px 16px", marginBottom: "16px",
              fontSize: "13px", color: "#9a3412", lineHeight: 1.7,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ flexShrink: 0, fontSize: "16px" }}>⚠️</span>
                <div>
                  {warnings.map((w, i) => <div key={i}>{w}</div>)}
                </div>
              </div>
            </div>
          )}

          {sortedResults.map(([key, val]) => (
            <div key={key} style={{
              background: "white",
              border: `1px solid ${val.exempt ? "#a7f3d0" : "#fecaca"}`,
              borderRadius: "12px", padding: "14px 16px", marginBottom: "8px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: val.reasons.length > 0 ? "6px" : 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {val.exempt ? <CheckCircle /> : <XCircle />}
                  <span style={{ fontSize: "16px", fontWeight: 700 }}>{val.label}</span>
                </div>
                <span style={{
                  fontSize: "13px", fontWeight: 700,
                  color: val.exempt ? "#059669" : "#dc2626",
                  background: val.exempt ? "#ecfdf5" : "#fef2f2",
                  padding: "3px 12px", borderRadius: "12px",
                }}>
                  {val.exempt ? "免除" : "免除なし"}
                </span>
              </div>
              {val.reasons.map((r, ri) => (
                <div key={ri} style={{
                  fontSize: "12px", color: "#64748b",
                  paddingLeft: "30px", lineHeight: 1.6,
                }}>→ {r}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Bonus note ── */}
      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: "10px", padding: "14px 16px", marginTop: "16px",
        fontSize: "12px", color: "#0369a1", lineHeight: 1.7,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ flexShrink: 0, fontSize: "14px" }}>ℹ️</span>
          <div>
            <strong>賞与の社会保険料について</strong><br />
            産後パパ育休は最大28日間のため、賞与にかかる社会保険料の免除条件（連続1ヶ月超の育休取得）を単独では満たしません。
            賞与の保険料免除を受けるには、通常の育児休業と組み合わせる必要があります。
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: "10px", padding: "14px 16px", marginTop: "10px",
        fontSize: "12px", color: "#92400e", lineHeight: 1.7,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ flexShrink: 0, fontSize: "14px" }}>⚠️</span>
          <div>
            <strong>ご注意</strong><br />
            本ツールは令和4年10月施行の健康保険法・厚生年金保険法の改正内容に基づく簡易的なチェックツールです。
            実際の免除可否は個別の状況により異なる場合があります。
            <strong>最終的な判断は必ず管轄の年金事務所にご確認ください。</strong>
          </div>
        </div>
      </div>

      {hasAnyPeriod && (
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button onClick={resetAll} style={{
            background: "none", border: "1px solid #e2e8f0",
            borderRadius: "8px", padding: "8px 20px",
            color: "#94a3b8", fontSize: "13px", cursor: "pointer",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>すべてリセット</button>
        </div>
      )}
    </div>
  );
}
