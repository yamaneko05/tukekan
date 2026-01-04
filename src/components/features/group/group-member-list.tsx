import { User } from "lucide-react";

type Member = {
  id: string;
  name: string;
  role: string;
};

type Props = {
  members: Member[];
  currentUserId: string;
};

export function GroupMemberList({ members, currentUserId }: Props) {
  if (members.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        メンバーがいません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-4 py-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="font-medium">{member.name}</span>
            {member.id === currentUserId && (
              <span className="ml-2 text-xs text-muted-foreground">(自分)</span>
            )}
          </div>
          {member.role === "ADMIN" && (
            <span className="text-xs text-muted-foreground">管理者</span>
          )}
        </div>
      ))}
    </div>
  );
}
