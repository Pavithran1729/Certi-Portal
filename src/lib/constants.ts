export const UG_DEGREES = [
  { value: "be", label: "B.E. (Bachelor of Engineering)" },
  { value: "btech", label: "B.Tech (Bachelor of Technology)" },
] as const;

export const BRANCHES: Record<string, { value: string; label: string }[]> = {
  be: [
    { value: "cse", label: "Computer Science and Engineering" },
    { value: "ece", label: "Electronics and Communication Engineering" },
    { value: "eee", label: "Electrical and Electronics Engineering" },
    { value: "mech", label: "Mechanical Engineering" },
    { value: "civil", label: "Civil Engineering" },
    { value: "it", label: "Information Technology" },
  ],
  btech: [
    { value: "aids", label: "Artificial Intelligence and Data Science" },
    { value: "csbs", label: "Computer Science and Business Systems" },
    { value: "it", label: "Information Technology" },
  ],
};

export const YEARS = [
  { value: "I", label: "I Year" },
  { value: "II", label: "II Year" },
  { value: "III", label: "III Year" },
  { value: "IV", label: "IV Year" },
] as const;

export const SECTIONS = [
  { value: "A", label: "Section A" },
  { value: "B", label: "Section B" },
  { value: "C", label: "Section C" },
] as const;

export const SEMESTERS = [
  { value: "I", label: "I Semester" },
  { value: "II", label: "II Semester" },
  { value: "III", label: "III Semester" },
  { value: "IV", label: "IV Semester" },
  { value: "V", label: "V Semester" },
  { value: "VI", label: "VI Semester" },
  { value: "VII", label: "VII Semester" },
  { value: "VIII", label: "VIII Semester" },
] as const;

export const CERTIFICATE_TYPES = [
  { value: "tc", label: "Transfer Certificate", icon: "FileText" },
  { value: "bonafide", label: "Bonafide Certificate", icon: "Award" },
  { value: "attendance", label: "Attendance Certificate", icon: "ClipboardCheck" },
  { value: "conduct", label: "Conduct Certificate", icon: "UserCheck" },
  { value: "training", label: "Training Certificate", icon: "Briefcase" },
  { value: "course_completion", label: "Course Completion Certificate", icon: "GraduationCap" },
  { value: "internship", label: "Internship Training Letter", icon: "Briefcase" },
] as const;

export const CERTIFICATE_STATUS = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "destructive" },
} as const;

export const TRAINING_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "industrial_visit", label: "Industrial Visit" },
] as const;
