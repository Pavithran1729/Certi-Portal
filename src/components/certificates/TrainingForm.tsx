import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const trainingFormSchema = z.object({
  trainingTitle: z.string().min(5, "Training title is required").max(200),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  conductedBy: z.string().optional().default(""),
  trainingType: z.string().optional().default(""),
  skillsAcquired: z.string().optional().default(""),
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

interface TrainingFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const TrainingForm = ({ onSuccess, isLoading = false }: TrainingFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: { trainingTitle: "", fromDate: "", toDate: "", conductedBy: "", trainingType: "", skillsAcquired: "" },
  });

  const onSubmit = async (data: TrainingFormData) => {
    try {
      await submit("training", data, (id) => {
        toast.success("Training Certificate request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Training Certificate</CardTitle>
        <CardDescription>Request a workshop or internship training certificate</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>Training Title *</FormLabel>
              <FormControl><Input placeholder="e.g., Advanced Web Development Workshop" {...form.register("trainingTitle")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.trainingTitle?.message}</FormMessage>
            </FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>From Date *</FormLabel>
                <FormControl><Input type="date" {...form.register("fromDate")} className="input-styled" /></FormControl>
                <FormMessage>{form.formState.errors.fromDate?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>To Date *</FormLabel>
                <FormControl><Input type="date" {...form.register("toDate")} className="input-styled" /></FormControl>
                <FormMessage>{form.formState.errors.toDate?.message}</FormMessage>
              </FormItem>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem><FormLabel>Conducted By</FormLabel><FormControl><Input placeholder="e.g., XYZ Institute" {...form.register("conductedBy")} className="input-styled" /></FormControl></FormItem>
              <FormItem><FormLabel>Training Type</FormLabel><FormControl><Input placeholder="e.g., Workshop, Internship" {...form.register("trainingType")} className="input-styled" /></FormControl></FormItem>
            </div>
            <FormItem>
              <FormLabel>Skills Acquired</FormLabel>
              <FormControl><Textarea placeholder="List the skills you acquired during this training" {...form.register("skillsAcquired")} className="input-styled" /></FormControl>
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

export default TrainingForm;
