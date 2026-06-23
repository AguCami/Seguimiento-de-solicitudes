export function RequestsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "16px",
          padding: "16px",
          animation: `skeletonPulse 1.6s ease-in-out ${i * 0.1}s infinite`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ height: "14px", width: "55%", background: "rgba(255,255,255,0.18)", borderRadius: "8px" }} />
            <div style={{ height: "20px", width: "80px", background: "rgba(255,255,255,0.15)", borderRadius: "999px" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <div style={{ height: "20px", width: "60px", background: "rgba(255,255,255,0.12)", borderRadius: "999px" }} />
            <div style={{ height: "20px", width: "90px", background: "rgba(255,255,255,0.12)", borderRadius: "999px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: "11px", width: "30%", background: "rgba(255,255,255,0.1)", borderRadius: "6px" }} />
            <div style={{ height: "11px", width: "15%", background: "rgba(255,255,255,0.1)", borderRadius: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
