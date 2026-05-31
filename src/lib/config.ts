// College Configuration - Centralized settings for branding and customization

export const COLLEGE_CONFIG = {
  // Basic Information
  name: "St. Peter's College",
  fullName: "St. Peter's College of Engineering & Technology",
  shortName: "SPCET",
  tagline: "Excellence in Education",
  
  // Contact Information
  address: "St. Peter's College of Engineering and Technology, Avadi, Chennai, Tamil Nadu, India, Pin Code - 600 054",
  phone: "044-26558091",
  email: "spcet2008@gmail.com",
  website: "https://stpeters.edu",
  
  // Logo - set to null to use default GraduationCap icon
  logoUrl: null as string | null,
  
  // Certificate Types with metadata
  certificateTypes: [
    {
      id: "tc",
      title: "Transfer Certificate",
      description: "Request original or duplicate TC",
      icon: "FileText",
      color: "bg-blue-500",
    },
    {
      id: "bonafide",
      title: "Bonafide Certificate",
      description: "Proof of enrollment verification",
      icon: "Award",
      color: "bg-green-500",
    },
    {
      id: "attendance",
      title: "Attendance Certificate",
      description: "Official attendance record",
      icon: "ClipboardCheck",
      color: "bg-purple-500",
    },
    {
      id: "conduct",
      title: "Conduct Certificate",
      description: "Character and conduct verification",
      icon: "UserCheck",
      color: "bg-orange-500",
    },
    {
      id: "training",
      title: "Training Certificate",
      description: "Workshop & internship certificates",
      icon: "Briefcase",
      color: "bg-pink-500",
    },
  ],
  
  // Academic Configuration
  degrees: [
    { value: "btech", label: "B.Tech" },
    { value: "mtech", label: "M.Tech" },
    { value: "bsc", label: "B.Sc" },
    { value: "msc", label: "M.Sc" },
    { value: "bca", label: "BCA" },
    { value: "mca", label: "MCA" },
    { value: "bba", label: "BBA" },
    { value: "mba", label: "MBA" },
  ],
  
  branches: [
    { value: "cse", label: "Computer Science & Engineering" },
    { value: "ece", label: "Electronics & Communication" },
    { value: "eee", label: "Electrical & Electronics" },
    { value: "me", label: "Mechanical Engineering" },
    { value: "ce", label: "Civil Engineering" },
    { value: "it", label: "Information Technology" },
    { value: "aids", label: "AI & Data Science" },
    { value: "csbs", label: "CS & Business Systems" },
  ],
  
  years: [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
  ],
  
  sections: [
    { value: "A", label: "Section A" },
    { value: "B", label: "Section B" },
    { value: "C", label: "Section C" },
    { value: "D", label: "Section D" },
  ],
} as const;

export type CertificateType = typeof COLLEGE_CONFIG.certificateTypes[number]["id"];
