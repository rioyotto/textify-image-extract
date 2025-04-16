
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 24,
  className,
  text
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <RefreshCcw size={size} className={cn("animate-spin text-blue-500", className)} />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
