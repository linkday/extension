import { createApiClient } from "./api.gen";
import { env } from "$env/dynamic/public";

// This is a workaround for Zodios, which will check if the API url is valid during build time
export const api = createApiClient(env.PUBLIC_API_PREFIX || "https://www.google.com");
