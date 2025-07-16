import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";

const NotConnected = () => {
  return (
    <Alert className="flex items-center gap-3 bg-gray-800/90 border-yellow-400 text-gray-100">
      <AlertCircleIcon className="w-6 h-6 text-yellow-400" />
      <div>
        <AlertTitle className="font-bold text-yellow-400">Warning!</AlertTitle>
        <AlertDescription className="text-gray-300">
          Please connect your wallet to continue.
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default NotConnected;
