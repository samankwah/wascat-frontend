import { Badge, type BadgeTone } from "@/components/admin/ui";
import type { DataRequestStatus } from "@/lib/admin/data";

const TONES: Record<DataRequestStatus, BadgeTone> = {
  // The one that needs someone, so it is the one that stands out.
  PENDING: "measured",
  APPROVED: "published",
  DECLINED: "retired",
};

const LABELS: Record<DataRequestStatus, string> = {
  PENDING: "waiting",
  APPROVED: "approved",
  DECLINED: "declined",
};

export function RequestStatus({ status }: { status: DataRequestStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
