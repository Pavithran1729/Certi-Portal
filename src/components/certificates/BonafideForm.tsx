import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const bonafideFormSchema = z.object({
  purpose: z.string().min(3, "Please select or enter a purpose"),
  fathers_name: z.string().min(2, "Father's name is required"),
  academic_year: z.string().min(4, "Academic year is required (e.g., 2025-2026)"),
  category: z.string().optional().default(""),
  dobWords: z.string().optional().default(""),
  currentAddress: z.string().optional().default(""),
  division: z.string().optional().default(""),
});

type BonafideFormData = z.infer<typeof bonafideFormSchema>;

const PURPOSE_OPTIONS = [
  { value: "applying for scholarship benefits in railway pass", label: "Scholarship / Railway Pass" },
  { value: "continuation of education loan", label: "Education Loan" },
  { value: "applying for government scholarship", label: "Government Scholarship" },
  { value: "bank account opening", label: "Bank Account Opening" },
  { value: "hostel admission", label: "Hostel Admission" },
  { value: "other", label: "Other (specify below)" },
];

interface BonafideFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const BonafideForm = ({ onSuccess, isLoading = false }: BonafideFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<BonafideFormData>({
    resolver: zodResolver(bonafideFormSchema),
    defaultValues: { purpose: "", fathers_name: "", academic_year: "", category: "", dobWords: "", currentAddress: "", division: "" },
  });

  const selectedPurpose = form.watch("purpose");

  const onSubmit = async (data: BonafideFormData) => {
    try {
      await submit("bonafide", data, (id) => {
        toast.success("Bonafide Certificate request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Bonafide Certificate</CardTitle>
        <CardDescription>Request a bonafide (enrollment proof) certificate</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>Purpose of Certificate *</FormLabel>
              <Select onValueChange={(val) => form.setValue("purpose", val)} defaultValue="">
                <FormControl>
                  <SelectTrigger className="input-styled">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage>{form.formState.errors.purpose?.message}</FormMessage>
            </FormItem>

            {selectedPurpose === "other" && (
              <FormItem>
                <FormLabel>Specify Purpose *</FormLabel>
                <FormControl><Textarea placeholder="Explain why you need this bonafide certificate" {...form.register("purpose")} className="input-styled" /></FormControl>
              </FormItem>
            )}

            <FormItem>
              <FormLabel>Father's Name *</FormLabel>
              <FormControl><Input placeholder="e.g., Mr. RAMACHANDRAN V" {...form.register("fathers_name")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.fathers_name?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Academic Year *</FormLabel>
              <FormControl><Input placeholder="e.g., 2025-2026" {...form.register("academic_year")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.academic_year?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={(val) => form.setValue("category", val)} defaultValue="">
                <FormControl>
                  <SelectTrigger className="input-styled">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DOTE">DOTE</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="NRI">NRI</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Date of Birth (in words)</FormLabel>
              <FormControl><Input placeholder="e.g., First January Two Thousand" {...form.register("dobWords")} className="input-styled" /></FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Current Address</FormLabel>
              <FormControl><Textarea placeholder="Your current residential address" {...form.register("currentAddress")} className="input-styled" /></FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Division</FormLabel>
              <FormControl><Input placeholder="e.g., Section A, 4th Year" {...form.register("division")} className="input-styled" /></FormControl>
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

export default BonafideForm;
