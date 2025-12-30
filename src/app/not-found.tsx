import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">ページが見つかりません</h1>
              <p className="text-sm text-muted-foreground">
                お探しのページは存在しないか、移動した可能性があります。
              </p>
            </div>
            <Button className="w-full" asChild>
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
