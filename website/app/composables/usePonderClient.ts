import { createClient } from "@ponder/client";

let ponderClient: ReturnType<typeof createClient> | null = null;

export const usePonderClient = () => {
  const runtimeConfig = useRuntimeConfig();
  const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");

  if (!ponderClient) {
    ponderClient = createClient(`${baseUrl}/sql`);
  }

  return ponderClient;
};
