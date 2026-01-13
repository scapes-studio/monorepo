export type ProfileLinks = {
  url: string;
  email: string;
  twitter: string;
  github: string;
};

export type ProfileData = {
  avatar?: string;
  description?: string;
  links?: ProfileLinks;
};

export type ProfileResponse = {
  address: string;
  ens: string | null;
  data: ProfileData;
  updatedAt: string;
};

export const useProfile = (identifier: Ref<string | null | undefined>) => {
  const runtimeConfig = useRuntimeConfig();

  const asyncKey = computed(() => `profile-${identifier.value?.toLowerCase() ?? "unknown"}`);

  return useAsyncData(
    asyncKey,
    async () => {
      if (!identifier.value) return null;
      const baseUrl = runtimeConfig.public.apiUrl.replace(/\/$/, "");
      return await $fetch<ProfileResponse>(`${baseUrl}/profiles/${identifier.value}`);
    },
  );
};
