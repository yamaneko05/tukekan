import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberWithBalance } from "@/actions/member";

type Props = {
  members: MemberWithBalance[];
};

export function MemberList({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        他のメンバーがいません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {members.map((member) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <span className="font-medium">{member.name}</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold tabular-nums",
                member.totalBalance < 0
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {member.totalBalance < 0 ? "-" : ""}¥
              {Math.abs(member.totalBalance).toLocaleString()}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
