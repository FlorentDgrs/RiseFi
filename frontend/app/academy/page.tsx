import { Suspense } from "react";
import AcademyContent from "../../components/shared/AcademyContent";

export default function AcademyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcademyContent />
    </Suspense>
  );
}
