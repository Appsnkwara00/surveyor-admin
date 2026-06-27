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
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  surcon_registration_number: string;
  surcon_prefix: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  whatsapp_number: string;
  company_name: string;
  company_address: string;
  residency: string;
  profile_image_url: string;
  is_active: boolean;
};

const empty: Omit<Surveyor, "id"> = {
  title: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  surcon_registration_number: "",
  surcon_prefix: "",
  date_of_birth: "",
  email: "",
  phone_number: "",
  whatsapp_number: "",
  company_name: "",
  company_address: "",
  residency: "",
  profile_image_url: "",
  is_active: false,
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
         console.log(error)
         console.log(data)
      if (error) throw error;
      console.log(error)
      return data as unknown as Surveyor[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("surveyors").update(form as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("surveyors").insert(form as any);
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
    setForm({
      title: s.title,
      first_name: s.first_name,
      middle_name: s.middle_name,
      last_name: s.last_name,
      surcon_registration_number: s.surcon_registration_number,
      surcon_prefix: s.surcon_prefix,
      date_of_birth: s.date_of_birth,
      email: s.email,
      phone_number: s.phone_number,
      whatsapp_number: s.whatsapp_number,
      company_name: s.company_name,
      company_address: s.company_address,
      residency: s.residency,
      profile_image_url: s.profile_image_url,
      is_active: s.is_active,
    });
    setOpen(true);
  };

  const fields: { key: keyof typeof empty; label: string; type?: string }[] = [
    { key: "title", label: "Title" },
    { key: "first_name", label: "First Name" },
    { key: "middle_name", label: "Middle Name" },
    { key: "last_name", label: "Last Name" },
    { key: "surcon_prefix", label: "SURCON Prefix" },
    { key: "surcon_registration_number", label: "SURCON Registration Number" },
    { key: "date_of_birth", label: "Date of Birth", type: "date" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone_number", label: "Phone Number", type: "tel" },
    { key: "whatsapp_number", label: "WhatsApp Number", type: "tel" },
    { key: "company_name", label: "Company Name" },
    { key: "company_address", label: "Company Address" },
    { key: "residency", label: "Residency" },
    { key: "profile_image_url", label: "Profile Image URL", type: "url" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="w-full max-w-6xl space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Surveyors</h1>
          <p className="text-muted-foreground mt-1">{data.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Surveyor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Surveyor</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const isCheckbox = f.type === "checkbox";
                return (
                  <div key={f.key} className={isCheckbox ? "flex items-center gap-2" : "space-y-1.5"}>
                    {isCheckbox ? (
                      <>
                        <Input
                          id={f.key}
                          type="checkbox"
                          checked={form[f.key] as boolean}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.checked as Surveyor[typeof f.key] })}
                        />
                        <Label htmlFor={f.key}>{f.label}</Label>
                      </>
                    ) : (
                      <>
                        <Label htmlFor={f.key}>{f.label}</Label>
                        <Input
                          id={f.key}
                          type={f.type ?? "text"}
                          required
                          value={form[f.key] as string}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value as Surveyor[typeof f.key] })}
                        />
                      </>
                    )}
                  </div>
                );
              })}
              <DialogFooter className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto px-2 py-2 sm:px-4 sm:py-4">
        <Table className="min-w-[820px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SURCON</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Residency</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No surveyors yet. Add one to get started.</TableCell></TableRow>
            ) : data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{[s.title, s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ")}</TableCell>
                <TableCell>{[s.surcon_prefix, s.surcon_registration_number].filter(Boolean).join("-")}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.phone_number}</TableCell>
                <TableCell>{s.whatsapp_number}</TableCell>
                <TableCell>{s.residency}</TableCell>
                <TableCell>{s.is_active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete ${[s.title, s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ")}?`)) del.mutate(s.id); }}>
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
