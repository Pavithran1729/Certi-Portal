import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const tcFormSchema = z.object({
  tcType: z.string().min(1, "TC Type is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  examName: z.string().optional().default(""),
  examYear: z.string().optional().default(""),
  examMonth: z.string().optional().default(""),
  seatNo: z.string().optional().default(""),
  cgpa: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  newCollegeName: z.string().optional().default(""),
  newCollegeAddress: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  contactAddress: z.string().optional().default(""),
});

type TCFormData = z.infer<typeof tcFormSchema>;

interface TCFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const TCForm = ({ onSuccess, isLoading = false }: TCFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<TCFormData>({
    resolver: zodResolver(tcFormSchema),
    defaultValues: {
      tcType: "", reason: "", examName: "", examYear: "", examMonth: "",
      seatNo: "", cgpa: "", grade: "", newCollegeName: "", newCollegeAddress: "",
      contactPhone: "", contactAddress: "",
    },
  });

  const onSubmit = async (data: TCFormData) => {
    try {
      await submit("tc", data, (id) => {
        toast.success("Transfer Certificate request submitted successfully!");
        form.reset();
        onSuccess?.(id);
      });
    } catch {
      toast.error("An error occurred while submitting the form");
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Transfer Certificate (TC)</CardTitle>
        <CardDescription>Provide details for your TC request</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>TC Type *</FormLabel>
              <FormControl>
                <Select value={form.watch("tcType")} onValueChange={(v) => form.setValue("tcType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select TC Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="photostat">Photostat</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{form.formState.errors.tcType?.message}</FormMessage>
            </FormItem>
            <FormItem>
              <FormLabel>Reason for TC *</FormLabel>
              <FormControl><Textarea placeholder="Explain why you need this TC" {...form.register("reason")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.reason?.message}</FormMessage>
            </FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem><FormLabel>Exam Name</FormLabel><FormControl><Input placeholder="e.g., Final Semester Exam" {...form.register("examName")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Exam Year</FormLabel><FormControl><Input placeholder="e.g., 2024" {...form.register("examYear")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Exam Month</FormLabel><FormControl><Input placeholder="e.g., May" {...form.register("examMonth")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Seat No</FormLabel><FormControl><Input placeholder="e.g., 001" {...form.register("seatNo")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>CGPA</FormLabel><FormControl><Input placeholder="e.g., 8.5" {...form.register("cgpa")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Grade</FormLabel><FormControl><Input placeholder="e.g., A+" {...form.register("grade")} className="input-styled" /></FormControl></FormItem>
            </div>
            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-foreground">New College (if applicable)</h3>
              <FormItem><FormLabel>College Name</FormLabel><FormControl><Input placeholder="Name of new college" {...form.register("newCollegeName")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>College Address</FormLabel><FormControl><Textarea placeholder="Address of new college" {...form.register("newCollegeAddress")} className="input-styled" /></FormControl></FormItem>
            </div>
            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-semibold text-foreground">Contact Information</h3>
              <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+91 XXXXXXXXXX" {...form.register("contactPhone")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Provide your contact address" {...form.register("contactAddress")} className="input-styled" /></FormControl></FormItem>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading} className="w-full btn-navy">
              {form.formState.isSubmitting ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Submitting...</span>
              ) : (
                <span className="flex items-center gap-2">Submit Request<ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TCForm;
