<script lang="ts">
	export let message: Record<number, string[]> | string[] | string | undefined;

	$: msgs = message instanceof Array ? message : [message];
</script>

{#each msgs as msg (msg)}
	{#if msg}
		<div class="font-normal text-red-500">
			<small>
				{msg}
			</small>
		</div>
	{/if}
{/each}
