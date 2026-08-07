import { CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NowEmptyState() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className="min-h-9 gap-2 rounded-md border-dashed px-3 font-normal text-muted-foreground"
      >
        <CircleDashed aria-hidden="true" />
        No current work shared yet
      </Badge>
    </div>
  );
}
