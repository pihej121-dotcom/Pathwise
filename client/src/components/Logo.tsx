import logoImg from "../assets/pathwise-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-24 h-24"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={logoImg}
        alt="Pathwise Logo" 
        className={`${sizeClasses[size]} object-contain`}
        data-testid="pathwise-logo"
      />
    </div>
  );
}