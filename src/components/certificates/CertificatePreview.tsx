import React from "react";
import AttendanceCertificate from "./AttendanceCertificate";
import BonafideCertificate from "./BonafideCertificate";
import ConductCertificate from "./ConductCertificate";
import CourseCompletionCertificate from "./CourseCompletionCertificate";
import InternshipCertificate from "./InternshipCertificate";
import TCCertificate from "./TCCertificate";
import TrainingCertificate from "./TrainingCertificate";

interface CertificatePreviewProps {
  certificateType: string;
  formData: Record<string, any>;
  studentData: {
    full_name?: string;
    roll_number?: string;
    branch?: string;
    year?: string;
    degree?: string;
    section?: string;
  } | null;
  issueDate?: string;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificateType,
  formData,
  studentData,
  issueDate,
}) => {
  const name = studentData?.full_name || formData?.student_name || formData?.studentName;
  const rollNo = studentData?.roll_number || formData?.roll_number || formData?.rollNo;
  const branch = studentData?.branch || formData?.branch;
  const year = studentData?.year || formData?.year;
  const degree = studentData?.degree || formData?.degree || "B.E.";
  const date = issueDate ? new Date(issueDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");

  switch (certificateType) {
    case "attendance":
      return (
        <AttendanceCertificate
          studentName={name}
          rollNo={rollNo}
          course={`${degree} ${branch || ""}`}
          year={year}
          semester={formData?.semester}
          academicYear={formData?.academic_year || formData?.academicYear}
          workingDays={formData?.working_days || formData?.workingDays}
          daysAttended={formData?.days_attended || formData?.daysAttended}
          attendancePercentage={formData?.attendance_percentage || formData?.attendancePercentage}
          issueDate={date}
        />
      );

    case "bonafide":
      return (
        <BonafideCertificate
          studentName={name}
          rollNo={rollNo}
          course={degree}
          branch={branch}
          year={year}
          academicYear={formData?.academic_year || formData?.academicYear}
          fatherName={formData?.father_name || formData?.fatherName}
          issueDate={date}
        />
      );

    case "conduct":
      return (
        <ConductCertificate
          studentName={name}
          rollNo={rollNo}
          course={degree}
          branch={branch}
          year={year}
          academicYear={formData?.academic_year || formData?.academicYear}
          conduct={formData?.conduct || "Good"}
          issueDate={date}
        />
      );

    case "course_completion":
      return (
        <CourseCompletionCertificate
          studentName={name}
          fromDate={formData?.from_date || formData?.fromDate}
          toDate={formData?.to_date || formData?.toDate}
          degree={degree}
          branch={branch}
          specialisation={formData?.specialisation || formData?.specialization}
          issueDate={date}
        />
      );

    case "internship":
      return (
        <InternshipCertificate
          studentName={name}
          rollNo={rollNo}
          course={degree}
          branch={branch}
          companyName={formData?.company_name || formData?.companyName}
          internshipTitle={formData?.internship_title || formData?.internshipTitle || formData?.title}
          fromDate={formData?.from_date || formData?.fromDate || formData?.start_date}
          toDate={formData?.to_date || formData?.toDate || formData?.end_date}
          issueDate={date}
        />
      );

    case "tc":
      return (
        <TCCertificate
          studentName={name}
          rollNo={rollNo}
          course={degree}
          branch={branch}
          year={year}
          fatherName={formData?.father_name || formData?.fatherName}
          dateOfAdmission={formData?.date_of_admission || formData?.dateOfAdmission}
          dateOfLeaving={formData?.date_of_leaving || formData?.dateOfLeaving}
          conduct={formData?.conduct || "Good"}
          reason={formData?.reason || "Completion of Course"}
          issueDate={date}
        />
      );

    case "training":
      return (
        <TrainingCertificate
          studentName={name}
          rollNo={rollNo}
          course={degree}
          branch={branch}
          trainingTitle={formData?.training_title || formData?.trainingTitle || formData?.title}
          organizationName={formData?.organization_name || formData?.organizationName || formData?.organization}
          fromDate={formData?.from_date || formData?.fromDate || formData?.start_date}
          toDate={formData?.to_date || formData?.toDate || formData?.end_date}
          issueDate={date}
        />
      );

    default:
      return (
        <div className="p-8 text-center text-gray-500">
          <p>Certificate preview not available for type: {certificateType}</p>
        </div>
      );
  }
};

export default CertificatePreview;
