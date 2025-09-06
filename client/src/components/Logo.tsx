interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl", 
    lg: "text-4xl"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <h1 
        className={`${sizeClasses[size]} font-bold text-blue-600 dark:text-blue-400`}
        data-testid="pathwise-logo"
      >
        Pathwise
      </h1>
    </div>
  );
}