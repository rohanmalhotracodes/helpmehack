import { OpportunityApp } from "@/components/opportunity-app";
import { getOpportunityData } from "@/lib/provider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const payload = await getOpportunityData({ fallbackToDemo: true });
  return <OpportunityApp initialPayload={payload} />;
}
