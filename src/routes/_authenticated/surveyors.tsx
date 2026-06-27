import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/surveyors")({
  head: () => ({ meta: [{ title: "Surveyors" }] }),
  component: SurveyorsPage,
});

type Surveyor = {
  id: string;
  name: string;
  number: string;
  email: string;
  company_name: string;
  address: string;
  registration_number: string;
};

const empty: Omit<Surveyor, "id"> = {
  name: "", number: "", email: "", company_name: "", address: "", registration_number: "",
};

function SurveyorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Surveyor | null>(null);
  const [form, setForm] = useState(empty);

  const { data = [], isLoading } = useQuery({
    queryKey: ["surveyors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("surveyors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Surveyor[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("surveyors").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("surveyors").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveyors"] });
      qc.invalidateQueries({ queryKey: ["count", "surveyors"] });
      toast.success(editing ? "Surveyor updated" : "Surveyor added");
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("surveyors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["surveyors"] });
      qc.invalidateQueries({ queryKey: ["count", "surveyors"] });
      toast.success("Surveyor removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Surveyor) => {
    setEditing(s);
    setForm({ name: s.name, number: s.number, email: s.email, company_name: s.company_name, address: s.address, registration_number: s.registration_number });
    setOpen(true);
  };

  const fields: { key: keyof typeof empty; label: string; type?: string }[] = [
    { key: "name", label: "Name" },
    { key: "number", label: "Number" },
    { key: "email", label: "Email", type: "email" },
    { key: "company_name", label: "Company Name" },
    { key: "address", label: "Address" },
    { key: "registration_number", label: "Registration Number" },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Surveyors</h1>
          <p className="text-muted-foreground mt-1">{data.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Surveyor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Surveyor</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type={f.type ?? "text"}
                    required
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Reg. No.</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No surveyors yet. Add one to get started.</TableCell></TableRow>
            ) : data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.company_name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.number}</TableCell>
                <TableCell>{s.registration_number}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete ${s.name}?`)) del.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
