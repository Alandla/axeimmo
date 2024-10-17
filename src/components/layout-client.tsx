import config from "@/config";
import NextTopLoader from "nextjs-toploader";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
        {/* Show a progress bar at the top when navigating between pages */}
        <NextTopLoader color={config.colors.main} showSpinner={false} />

        {/* Content inside app/page.js files  */}
        {children}
    </>
  );
};

export default ClientLayout;