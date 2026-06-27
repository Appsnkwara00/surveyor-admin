import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admin Panel" },
      { name: "description", content: "Manage surveyors and executives." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/40 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage surveyors and executives in one place.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg"><Link to="/auth">Sign in</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/dashboard">Open Dashboard</Link></Button>
        </div>
      </div>
    </div>
  );
}
