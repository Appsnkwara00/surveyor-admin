import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/executives")({
  head: () => ({ meta: [{ title: "Executives" }] }),
  component: ExecutivesPage,
});

type Executive = { id: string; name: string; position: string; image?: string | null };
type ExecutiveForm = { name: string; position: string; image: string | null };
type ExecutiveRow = { id: string; name: string; position: string; image?: string | null };
const emptyForm: ExecutiveForm = { name: "", position: "", image: null };

function ExecutivesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Executive | null>(null);
  const [form, setForm] = useState<ExecutiveForm>(emptyForm);
  const [isUploading, setIsUploading] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["executives"],
    queryFn: async () => {
      const { data: executiveRows, error } = await supabase.from("executives").select("*");
      if (error) throw error;

      const rows = (executiveRows as unknown as ExecutiveRow[]) ?? [];
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        position: row.position ?? "",
        image: row.image ?? null,
      })) as Executive[];
    },
  });

  const uploadImage = async (file: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Please set the upload credentials first.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || "Image upload failed.");
    }

    return result.secure_url as string;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) {
        throw new Error("Select an executive to edit.");
      }

      const payload = {
        name: form.name,
        position: form.position,
        image: form.image ?? null,
      };

      const { error } = await supabase.from("executives").update(payload as any).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executives"] });
      qc.invalidateQueries({ queryKey: ["count", "executives"] });
      toast.success("Executive updated");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (e: Executive) => {
    setEditing(e);
    setForm({ name: e.name, position: e.position, image: e.image ?? null });
    setOpen(true);
  };

  return (
    <div className="w-full max-w-6xl space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Executives</h1>
          <p className="text-muted-foreground mt-1">{data.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Executive</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">Post Held</Label>
                <Input id="position" required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image">Executive Photo</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setIsUploading(true);
                      const url = await uploadImage(file);
                      setForm((current) => ({ ...current, image: url }));
                      toast.success("Image uploaded");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Image upload failed");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
                {isUploading ? (
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                ) : form.image ? (
                  <div className="mt-2 space-y-2">
                    <img src={form.image} alt="Executive preview" className="h-24 w-24 rounded-md border object-cover" />
                    <p className="break-all text-xs text-muted-foreground">{form.image}</p>
                  </div>
                ) : null}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto px-2 py-2 sm:px-4 sm:py-4">
        <Table className="min-w-[620px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Post Held</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No executives yet.</TableCell></TableRow>
            ) : data.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {e.image ? (
                    <img src={e.image} alt={e.name} className="h-12 w-12 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border text-xs text-muted-foreground">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.position}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
