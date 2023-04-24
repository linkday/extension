<div class="w-full p-8 font-spectrul text-2xl font-bold shadow-sm">LINKDAY</div>
<slot />
<div class="flex w-full flex-col items-center justify-center bg-gray-100 p-8">
	<div class="flex self-center font-spectrul text-xs font-bold text-gray-400">
		© {new Date().getFullYear()} Linkday Extension
	</div>
	<div class="flex self-center font-spectrul text-xs font-bold text-gray-400">
		Powered By Linkday Team
	</div>
</div>

<style>
	:global(body::-webkit-scrollbar) {
		width: 0.5em;
	}

	:global(body::-webkit-scrollbar-track) {
		background: #eee;
	}

	:global(body::-webkit-scrollbar-thumb) {
		background: #888;
	}

	:global(body::-webkit-scrollbar-thumb:hover) {
		background: #444;
	}
</style>
