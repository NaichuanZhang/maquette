export function DeviceBar({
  rows,
}: {
  rows: Array<{ label: string; value: number }>;
}) {
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">No device data yet.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const pct = Math.round((row.value / total) * 100);
        return (
          <li key={row.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-xs">
              <span>{row.label}</span>
              <span className="font-mono text-muted-foreground">
                {row.value} ({pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-foreground"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
