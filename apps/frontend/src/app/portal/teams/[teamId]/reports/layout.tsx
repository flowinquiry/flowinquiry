import { TimeRangeProvider } from "@/providers/time-range-provider";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimeRangeProvider>
      <div className="reports-container">{children}</div>
    </TimeRangeProvider>
  );
}
