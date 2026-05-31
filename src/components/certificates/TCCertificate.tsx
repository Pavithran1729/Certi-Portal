import React from "react";

interface TCCertificateProps {
  studentName?: string;
  rollNo?: string;
  course?: string;
  branch?: string;
  year?: string;
  fatherName?: string;
  dateOfAdmission?: string;
  dateOfLeaving?: string;
  conduct?: string;
  reason?: string;
  issueDate?: string;
  tcNo?: string;
}

const TCCertificate: React.FC<TCCertificateProps> = ({
  studentName = "_________________",
  rollNo = "_________________",
  course = "B.E.",
  branch = "Computer Science and Engineering",
  year = "____",
  fatherName = "_________________",
  dateOfAdmission = "_________________",
  dateOfLeaving = "_________________",
  conduct = "Good",
  reason = "Completion of Course",
  issueDate = new Date().toLocaleDateString("en-IN"),
  tcNo = "SPCET/TC/" + new Date().getFullYear(),
}) => {
  return (
    <div
      className="w-[210mm] min-h-[297mm] bg-white p-10 mx-auto shadow-2xl text-black font-serif flex flex-col"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <div className="flex-1 flex flex-col border-[3px] border-gray-800 p-2">
        <div className="flex-1 flex flex-col border-[1px] border-gray-600 p-6">

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

          <div className="flex justify-between text-sm mb-8">
            <p>T.C. No: <span className="font-semibold">{tcNo}</span></p>
            <p>Date: <span className="font-semibold">{issueDate}</span></p>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold uppercase underline decoration-2 underline-offset-4 tracking-widest">
              Transfer Certificate
            </h2>
          </div>

          {/* TC Details in tabular format */}
          <div className="space-y-4 text-base leading-relaxed px-4 flex-1">
            <div className="grid grid-cols-[240px_20px_1fr] gap-y-3">
              <span className="font-medium">1. Name of the Student</span><span>:</span>
              <span className="font-bold">{studentName}</span>

              <span className="font-medium">2. Name of Father/Guardian</span><span>:</span>
              <span className="font-bold">{fatherName}</span>

              <span className="font-medium">3. Roll No / Register Number</span><span>:</span>
              <span className="font-bold">{rollNo}</span>

              <span className="font-medium">4. Course &amp; Branch</span><span>:</span>
              <span className="font-bold">{course} - {branch}</span>

              <span className="font-medium">5. Year of Study</span><span>:</span>
              <span className="font-bold">{year}</span>

              <span className="font-medium">6. Date of Admission</span><span>:</span>
              <span className="font-bold">{dateOfAdmission}</span>

              <span className="font-medium">7. Date of Leaving</span><span>:</span>
              <span className="font-bold">{dateOfLeaving}</span>

              <span className="font-medium">8. Conduct &amp; Character</span><span>:</span>
              <span className="font-bold">{conduct}</span>

              <span className="font-medium">9. Reason for Leaving</span><span>:</span>
              <span className="font-bold">{reason}</span>
            </div>

            <p className="mt-8 text-justify indent-12">
              This Transfer Certificate is issued on the request of the student / parent / guardian for the
              purpose it may serve.
            </p>
          </div>

          {/* Signature & Seal Section */}
          <div className="mt-16 pt-4">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs text-center">
                College<br />Seal
              </div>
            </div>
            <div className="flex justify-between items-end text-base px-4">
              <div className="text-center">
                <div className="w-40 border-t border-gray-800 mb-1" />
                <p className="font-bold">HOD</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-gray-800 mb-1" />
                <p className="font-bold">Principal</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TCCertificate;
