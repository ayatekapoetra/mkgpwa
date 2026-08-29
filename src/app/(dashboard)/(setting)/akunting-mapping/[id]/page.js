"use client";

import { useParams } from "next/navigation";
import AkuntingMappingForm from "views/setting/akunting-mapping/form";

export default function Page() {
  const params = useParams();
  return <AkuntingMappingForm mappingId={params?.id} />;
}
