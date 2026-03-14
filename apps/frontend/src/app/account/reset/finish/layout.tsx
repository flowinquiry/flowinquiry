import { SessionProvider } from "next-auth/react";

import { ModeToggle } from "@/components/mode-toggle";
import { ErrorProvider } from "@/providers/error-provider";

const ResetFinishLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <div className="h-screen flex items-center justify-center relative">
        <ErrorProvider>
          <div className="absolute bottom-5 right-0">
            <ModeToggle />
          </div>
          {children}
        </ErrorProvider>
      </div>
    </SessionProvider>
  );
};

export default ResetFinishLayout;
