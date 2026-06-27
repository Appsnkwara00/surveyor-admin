import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: surveyorsCount } = useQuery({
    queryKey: ["count", "surveyors"],
    queryFn: async () => {
      const { count, error } = await supabase.from("surveyors").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: execsCount } = useQuery({
    queryKey: ["count", "executives"],
    queryFn: async () => {
      const { count, error } = await supabase.from("executives").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Surveyors", value: surveyorsCount, icon: Users, to: "/surveyors" as const },
    { label: "Executives", value: execsCount, icon: Briefcase, to: "/executives" as const },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of surveyors and executives.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="group">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-semibold">{s.value ?? "—"}</div>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:text-foreground">
                    Manage <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
