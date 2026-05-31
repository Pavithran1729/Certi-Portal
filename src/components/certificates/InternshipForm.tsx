import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const internshipFormSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  company_address: z.string().min(5, "Company address is required"),
  academic_year: z.string().min(4, "Academic year is required (e.g., 2025-2026)"),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  reason: z.string().optional().default(""),
});

type InternshipFormData = z.infer<typeof internshipFormSchema>;

interface InternshipFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const InternshipForm = ({ onSuccess, isLoading = false }: InternshipFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<InternshipFormData>({
    resolver: zodResolver(internshipFormSchema),
    defaultValues: { company_name: "", company_address: "", academic_year: "", from_date: "", to_date: "", reason: "" },
  });

  const onSubmit = async (data: InternshipFormData) => {
    try {
      await submit("internship" as any, data, (id) => {
        toast.success("Internship Training Letter request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Internship Training Letter</CardTitle>
        <CardDescription>Request an official internship training letter addressed to a company</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl><Input placeholder="e.g., Sterile – Gene Life Science (P) Ltd" {...form.register("company_name")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.company_name?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Company Address *</FormLabel>
              <FormControl><Textarea placeholder="e.g., No:45, Main Road, Villianur, Pondicherry." {...form.register("company_address")} className="input-styled" rows={3} /></FormControl>
              <FormMessage>{form.formState.errors.company_address?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Academic Year *</FormLabel>
              <FormControl><Input placeholder="e.g., 2025-2026" {...form.register("academic_year")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.academic_year?.message}</FormMessage>
            </FormItem>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Internship From Date *</FormLabel>
                <FormControl><Input type="date" {...form.register("from_date")} className="input-styled" /></FormControl>
                <FormMessage>{form.formState.errors.from_date?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>Internship To Date *</FormLabel>
                <FormControl><Input type="date" {...form.register("to_date")} className="input-styled" /></FormControl>
                <FormMessage>{form.formState.errors.to_date?.message}</FormMessage>
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Reason for Request</FormLabel>
              <FormControl><Textarea placeholder="Why do you need this internship letter?" {...form.register("reason")} className="input-styled" /></FormControl>
            </FormItem>

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

export default InternshipForm;
