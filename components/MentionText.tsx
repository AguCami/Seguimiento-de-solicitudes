export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.match(/^@\w+$/) ? (
          <span key={i} style={{
            background: "rgba(var(--a1),0.25)", color: "rgba(165,180,252,0.95)",
            borderRadius: "4px", padding: "0 4px", fontWeight: 600, fontSize: "0.9em",
          }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
