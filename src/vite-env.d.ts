/// <reference types="vite/client" />

interface ImportMetaEnv {
	VITE_API_PREFIX: string;
}

interface ImportMeta {
	env: ImportMetaEnv;
}
