import React from "react";

interface InternshipCertificateProps {
  studentName?: string;
  rollNo?: string;
  course?: string;
  branch?: string;
  companyName?: string;
  internshipTitle?: string;
  fromDate?: string;
  toDate?: string;
  issueDate?: string;
  refNo?: string;
}

const InternshipCertificate: React.FC<InternshipCertificateProps> = ({
  studentName = "_________________",
  rollNo = "_________________",
  course = "B.E.",
  branch = "Computer Science and Engineering",
  companyName = "_________________",
  internshipTitle = "_________________",
  fromDate = "_________________",
  toDate = "_________________",
  issueDate = new Date().toLocaleDateString("en-IN"),
  refNo = "SPCET/INT/" + new Date().getFullYear(),
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
            <p>Ref. No: <span className="font-semibold">{refNo}</span></p>
            <p>Date: <span className="font-semibold">{issueDate}</span></p>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold uppercase underline decoration-2 underline-offset-4 tracking-widest">
              Internship Certificate
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-loose px-4 flex-1">
            <p className="text-justify indent-12">
              This is to certify that Mr./Ms. <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{studentName}</span>,
              bearing Roll No. / Register Number <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{rollNo}</span>,
              a student of <span className="font-bold px-1">{course} - {branch}</span>, has successfully completed
              an internship at <span className="font-bold underline decoration-dotted underline-offset-4 px-1">{companyName}</span> on
              the topic <span className="font-bold italic px-1">"{internshipTitle}"</span>.
            </p>

            <p className="text-justify indent-12">
              The internship was carried out from <span className="font-bold px-1">{fromDate}</span> to <span className="font-bold px-1">{toDate}</span>.
            </p>

            <p className="text-justify indent-12">
              During the internship period, the student demonstrated sincerity, dedication and a keen interest in
              learning. His/Her conduct and character were found to be <span className="font-bold">Good</span>.
            </p>

            <p className="text-justify indent-12">
              We wish him/her all the best for future endeavors.
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

export default InternshipCertificate;
