import spcetLogo from "@/assets/spcet-logo.jpg";

interface CollegeLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
}

const CollegeLogo = ({ size = "md", showText = true, variant = "dark" }: CollegeLogoProps) => {
  const sizes = {
    sm: { img: "h-8 w-8", text: "text-sm", gap: "gap-2" },
    md: { img: "h-11 w-11", text: "text-lg", gap: "gap-3" },
    lg: { img: "h-16 w-16", text: "text-2xl", gap: "gap-4" },
  };

  const textColor = variant === "light" ? "text-white" : "text-primary";

  return (
    <div className={`flex items-center ${sizes[size].gap}`}>
      <img
        src={spcetLogo}
        alt="SPCET Logo"
        className={`${sizes[size].img} rounded-full object-contain bg-white`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold ${sizes[size].text} ${textColor} leading-tight`}>
            St. Peter's College
          </span>
          <span className={`text-xs ${variant === "light" ? "text-gold-300" : "text-muted-foreground"} tracking-wide`}>
            of Engineering & Technology
          </span>
        </div>
      )}
    </div>
  );
};

export default CollegeLogo;
