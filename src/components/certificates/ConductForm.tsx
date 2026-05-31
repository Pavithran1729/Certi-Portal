import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const conductFormSchema = z.object({
  periodOfStudy: z.string().min(5, "Period of study is required").max(200),
  purpose: z.string().optional().default(""),
});

type ConductFormData = z.infer<typeof conductFormSchema>;

interface ConductFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const ConductForm = ({ onSuccess, isLoading = false }: ConductFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<ConductFormData>({
    resolver: zodResolver(conductFormSchema),
    defaultValues: { periodOfStudy: "", purpose: "" },
  });

  const onSubmit = async (data: ConductFormData) => {
    try {
      await submit("conduct", data, (id) => {
        toast.success("Conduct Certificate request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" />Conduct Certificate</CardTitle>
        <CardDescription>Request a character and conduct verification certificate</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>Period of Study *</FormLabel>
              <FormControl><Input placeholder="e.g., 2020-2024 or First Year to Fourth Year" {...form.register("periodOfStudy")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.periodOfStudy?.message}</FormMessage>
            </FormItem>
            <FormItem>
              <FormLabel>Purpose of Certificate</FormLabel>
              <FormControl><Textarea placeholder="Explain why you need this conduct certificate" {...form.register("purpose")} className="input-styled" /></FormControl>
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

export default ConductForm;
