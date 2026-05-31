import React from "react";

interface AttendanceCertificateProps {
  studentName?: string;
  course?: string;
  year?: string;
  semester?: string;
  rollNo?: string;
  academicYear?: string;
  workingDays?: string;
  daysAttended?: string;
  attendancePercentage?: string;
  issueDate?: string;
}

const AttendanceCertificate: React.FC<AttendanceCertificateProps> = ({
  studentName = "_________________",
  course = "B.E. Computer Science and Engineering",
  year = "____",
  semester = "____",
  rollNo = "_________________",
  academicYear = "2023-2024",
  workingDays = "____",
  daysAttended = "____",
  attendancePercentage = "____",
  issueDate = new Date().toLocaleDateString("en-IN"),
}) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-10 mx-auto shadow-2xl relative text-black font-serif" style={{ fontFamily: "Times New Roman, serif" }}>
      {/* Double border */}
      <div className="absolute inset-3 border-[3px] border-gray-800 pointer-events-none" />
      <div className="absolute inset-5 border-[1px] border-gray-600 pointer-events-none" />

      <div className="relative z-10 px-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
          <div className="w-20 h-20 flex-shrink-0">
            <img src="/spcet_logo.png" alt="SPCET Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center flex-grow px-4">
            <h1 className="text-2xl font-bold text-red-700 tracking-wide uppercase mb-1">
              St. Peter's College of Engineering and Technology
            </h1>
            <p className="text-xs font-medium italic">(Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai)</p>
            <p className="text-xs font-medium italic">ISO 9001:2015 Certified Institution</p>
            <p className="text-xs">College Road, Avadi, Chennai - 600054</p>
          </div>
          <div className="w-20 h-20 flex-shrink-0">
            <img src="/anna-university-logo.webp" alt="Anna University Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Ref & Date */}
        <div className="flex justify-between text-sm mb-8">
          <p>Ref. No: <span className="font-semibold">SPCET/ATT/{new Date().getFullYear()}</span></p>
          <p>Date: <span className="font-semibold">{issueDate}</span></p>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold uppercase underline decoration-2 underline-offset-4 tracking-widest">
            Attendance Certificate
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-6 text-lg leading-loose px-4">
          <p className="text-justify indent-12">
            This is to certify that Mr./Ms. <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{studentName}</span>,
            Roll No / Register Number <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{rollNo}</span> is a bonafide
            student of <span className="font-bold px-1">{year}</span> year /
            <span className="font-bold px-1">{semester}</span> semester,
            <span className="font-bold px-1">{course}</span> during the academic year
            <span className="font-bold px-1">{academicYear}</span>.
          </p>

          <p className="text-justify indent-12">
            His/Her attendance particulars are as follows:
          </p>

          {/* Attendance table */}
          <div className="mx-8 border border-gray-800">
            <div className="grid grid-cols-2 border-b border-gray-800">
              <span className="p-3 font-medium border-r border-gray-800">Total Number of Working Days</span>
              <span className="p-3 font-bold text-center">{workingDays}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-gray-800">
              <span className="p-3 font-medium border-r border-gray-800">Number of Days Attended</span>
              <span className="p-3 font-bold text-center">{daysAttended}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="p-3 font-medium border-r border-gray-800">Percentage of Attendance</span>
              <span className="p-3 font-bold text-center">{attendancePercentage}%</span>
            </div>
          </div>

          <p className="text-center italic mt-6 text-base font-medium">
            His/Her conduct and character are found to be <span className="font-bold">Good</span>.
          </p>
        </div>

          {/* Signatures */}
          <div className="flex justify-between items-end text-base mt-16 px-4 relative">
            <div className="text-center">
              <div className="w-40 border-t border-gray-800 mb-1" />
              <p className="font-bold">HOD</p>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs text-center">
              College<br />Seal
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-gray-800 mb-1" />
              <p className="font-bold">Principal</p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AttendanceCertificate;
