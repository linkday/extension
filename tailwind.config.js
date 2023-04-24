/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{html,svelte,vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			screens: {
				"!md": { max: "767px" },
				"!lg": { max: "1023px" },
			},
			colors: {
				main: "#833CAB",
				hover: "#a353ff",
			},
			fontFamily: {
				spectrul: ["Spectral", "serif"],
			},
		},
	},
	plugins: [],
};
