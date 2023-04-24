import { createApiClient } from "./api.client";

export const api = createApiClient(import.meta.env.VITE_API_PREFIX);
