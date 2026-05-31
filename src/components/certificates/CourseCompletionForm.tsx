import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const courseCompletionFormSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  degree: z.string().min(1, "Degree is required"),
  branch: z.string().min(1, "Branch is required"),
  specialisation: z.string().optional().default(""),
  reason: z.string().optional().default(""),
});

type CourseCompletionFormData = z.infer<typeof courseCompletionFormSchema>;

interface CourseCompletionFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const CourseCompletionForm = ({ onSuccess, isLoading = false }: CourseCompletionFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<CourseCompletionFormData>({
    resolver: zodResolver(courseCompletionFormSchema),
    defaultValues: { fromDate: "", toDate: "", degree: "B.E.", branch: "", specialisation: "", reason: "" },
  });

  const onSubmit = async (data: CourseCompletionFormData) => {
    try {
      // Note: we cast the certificate type to any here
      // because we added it dynamically and TS might not know about it
      await submit("course_completion" as any, data, (id) => {
        toast.success("Course Completion Certificate request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Course Completion Certificate</CardTitle>
        <CardDescription>Request your official course completion certificate</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormItem>
                <FormLabel>Degree *</FormLabel>
                <Select onValueChange={(val) => form.setValue("degree", val)} defaultValue={form.getValues("degree")}>
                  <FormControl>
                    <SelectTrigger className="input-styled">
                      <SelectValue placeholder="Select Degree" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="B.E.">B.E.</SelectItem>
                    <SelectItem value="B.Tech.">B.Tech.</SelectItem>
                    <SelectItem value="M.E.">M.E.</SelectItem>
                    <SelectItem value="M.B.A.">M.B.A.</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage>{form.formState.errors.degree?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>Branch *</FormLabel>
                <FormControl><Input placeholder="e.g., Computer Science" {...form.register("branch")} className="input-styled" /></FormControl>
                <FormMessage>{form.formState.errors.branch?.message}</FormMessage>
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Specialisation (if applicable)</FormLabel>
              <FormControl><Input placeholder="e.g., Cyber Security" {...form.register("specialisation")} className="input-styled" /></FormControl>
              <FormMessage>{form.formState.errors.specialisation?.message}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Reason for Request</FormLabel>
              <FormControl><Textarea placeholder="Why do you need this certificate?" {...form.register("reason")} className="input-styled" /></FormControl>
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

export default CourseCompletionForm;
