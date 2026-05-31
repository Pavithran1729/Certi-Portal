import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { useSubmitCertificate } from "@/hooks/useSubmitCertificate";
import { toast } from "sonner";

const attendanceFormSchema = z.object({
  semester: z.string().min(1, "Semester is required"),
  academic_year: z.string().min(1, "Academic year is required"),
  working_days: z.string().min(1, "Working days is required"),
  days_attended: z.string().min(1, "Days attended is required"),
  attendance_percentage: z.string().min(1, "Attendance percentage is required"),
  reason: z.string().optional().default(""),
});

type AttendanceFormData = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  onSuccess?: (certificateId: string) => void;
  isLoading?: boolean;
}

const AttendanceForm = ({ onSuccess, isLoading = false }: AttendanceFormProps) => {
  const { submit } = useSubmitCertificate();
  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      semester: "",
      academic_year: "",
      working_days: "",
      days_attended: "",
      attendance_percentage: "",
      reason: "",
    },
  });

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      await submit("attendance", data, (id) => {
        toast.success("Attendance Certificate request submitted successfully!");
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
        <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Attendance Certificate</CardTitle>
        <CardDescription>Request your official attendance record</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Semester & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Semester *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., IV" {...form.register("semester")} className="input-styled" />
                </FormControl>
                <FormMessage>{form.formState.errors.semester?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>Academic Year *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2023-2024" {...form.register("academic_year")} className="input-styled" />
                </FormControl>
                <FormMessage>{form.formState.errors.academic_year?.message}</FormMessage>
              </FormItem>
            </div>

            {/* Attendance details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Total Working Days *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 90" {...form.register("working_days")} className="input-styled" />
                </FormControl>
                <FormMessage>{form.formState.errors.working_days?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>Days Attended *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 82" {...form.register("days_attended")} className="input-styled" />
                </FormControl>
                <FormMessage>{form.formState.errors.days_attended?.message}</FormMessage>
              </FormItem>
              <FormItem>
                <FormLabel>Attendance % *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 91.1" step="0.1" {...form.register("attendance_percentage")} className="input-styled" />
                </FormControl>
                <FormMessage>{form.formState.errors.attendance_percentage?.message}</FormMessage>
              </FormItem>
            </div>

            {/* Reason */}
            <FormItem>
              <FormLabel>Reason for Request</FormLabel>
              <FormControl>
                <Textarea placeholder="Why do you need this attendance certificate?" {...form.register("reason")} className="input-styled" />
              </FormControl>
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

export default AttendanceForm;
