import { getPostOptions } from "@/db/queries";
import { RecognitionForm } from "@/components/admin/recognition-form";

export default async function NewRecognitionPage() {
  return <RecognitionForm postOptions={await getPostOptions()} />;
}
