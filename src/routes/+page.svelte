<script lang="ts">
	import { superValidate, superForm } from "sveltekit-superforms/client";
	import { schemas, type Tag } from "../api/api.gen";
	import ErrorMessage from "../components/ErrorMessage.svelte";
	import { api } from "../api";
	import { tick } from "svelte";
	import "../index.css";
	import { browser } from "$app/environment";
	import { ExtensionMode } from "../models/extension-mode";
	import { env } from "$env/dynamic/public";
	import { tweened } from "svelte/motion";
	import { circIn } from "svelte/easing";

	export let data;
	let success: boolean | undefined = undefined;

	function getExtensionMode(): ExtensionMode {
		return data.mode;
	}
	$: mode = getExtensionMode();

	const { form, errors, constraints } = superForm(data.form);

	if (browser) {
		try {
			chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
				$form.url = tabs[0].url || "";
			});
		} catch (err) {
			console.error(err);
		}
	}

	const BookmarkPayload = schemas.BookmarkPayload.refine((val) => val.tag_ids.length > 0, {
		message: "At least one tag is required",
		path: ["tag_ids"],
	});

	let tagSerachString = "";
	$: filteredTags = data.tags.data.filter((tag) => {
		if (tagSerachString === "") return false;

		return tag.name.toLowerCase().includes(tagSerachString.toLowerCase());
	});

	let selectedTags: Tag[] = [];
	$: selectedTagNames = selectedTags.map((tag) => tag.name);
	$: $form.tag_ids = selectedTags.map((tag) => tag.id);

	async function addTag(tag: Tag) {
		selectedTags = [...selectedTags, tag];
		tagSerachString = "";

		await tick();
		superValidate($form, BookmarkPayload).then((result) => {
			$errors.tag_ids = result.errors.tag_ids;
		});
	}
	async function createTag() {
		const tag = {
			name: tagSerachString,
		};
		const result = await superValidate(tag, schemas.TagPayload);
		if (!result) return;

		try {
			const newTag = await api.addTag(tag, {
				withCredentials: true,
			});
			if (newTag.data) {
				data.tags.data = [...data.tags.data, newTag.data];
				addTag(newTag.data);
			}
		} catch (err) {
			console.error(err);
		}
	}

	let selectTagPanel: HTMLDivElement;
	let currentFocusIndex = 0;
	$: isSelectTagPanelOpen = tagSerachString !== "";
	async function handleClickEvent(event: MouseEvent) {
		if (selectTagPanel && !selectTagPanel.contains(event.target as Node)) {
			isSelectTagPanelOpen = false;
			currentFocusIndex = 0;

			await tick();
			superValidate($form, BookmarkPayload).then((result) => {
				$errors.tag_ids = result.errors.tag_ids;
			});
		}
	}

	let tagButtons: HTMLButtonElement[] = [];
	let tagInputElement: HTMLInputElement;
	$: filteredTagButtons = tagButtons.filter((button) => {
		if (!button) return false;

		return !button.disabled;
	});

	function onTagKeyDown(event: KeyboardEvent) {
		if (event.key === "ArrowUp" || event.key === "ArrowDown") {
			event.preventDefault();

			if (filteredTagButtons.length === 0) return;

			if (document.activeElement === tagInputElement) {
				filteredTagButtons[currentFocusIndex]?.focus();

				return;
			}

			if (event.key === "ArrowDown") {
				currentFocusIndex = (currentFocusIndex + 1) % filteredTagButtons.length;
				filteredTagButtons[currentFocusIndex]?.focus();
			} else if (event.key === "ArrowUp") {
				if (currentFocusIndex === 0) {
					tagInputElement.focus();

					return;
				}

				currentFocusIndex =
					(currentFocusIndex - 1 + filteredTagButtons.length) % filteredTagButtons.length;
				filteredTagButtons[currentFocusIndex]?.focus();
			}
		} else {
			currentFocusIndex = 0;
		}
	}

	let isSubmitting = false;

	const strokeOffset = tweened(50, {
		duration: 250,
		easing: circIn,
	});
</script>

<svelte:window on:click={handleClickEvent} />

<div class="min-w-[360px]">
	{#if mode === ExtensionMode.ShowForm}
		<div class="mb-4 flex flex-col p-8">
			<div class="mb-12 text-4xl font-bold">Add Bookmark</div>
			<div class="grid grid-flow-row gap-4">
				<div class="flex flex-col gap-2">
					<label class="mb-2 block text-sm font-medium text-gray-900">
						Url
						<input
							type="text"
							class="mb-1 mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
							placeholder="https://example.com"
							bind:value={$form.url}
							{...$constraints.url}
							on:input={() => {
								superValidate($form, BookmarkPayload).then((result) => {
									$errors.url = result.errors.url;
								});
							}}
						/>

						<ErrorMessage message={$errors.url} />
					</label>

					<label class="mb-2 block text-sm font-medium text-gray-900">
						Tags
						<input
							type="text"
							class="mb-1 mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
							placeholder="Add tags..."
							bind:value={tagSerachString}
							on:keydown={onTagKeyDown}
							bind:this={tagInputElement}
						/>

						{#if isSelectTagPanelOpen}
							<div
								class="relative max-w-[calc(100vw-4rem)] md:max-w-[35%]"
								bind:this={selectTagPanel}
								on:keydown={onTagKeyDown}
							>
								<div class="flex flex-col rounded-lg border border-gray-300 bg-white p-2 shadow-md">
									{#each filteredTags as tag, index (index)}
										<button
											class="flex flex-col gap-1 overflow-y-hidden rounded-md p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
											on:click={() => addTag(tag)}
											disabled={selectedTagNames.includes(tag.name)}
											bind:this={tagButtons[index]}
										>
											<div class="text-left text-sm font-medium">{tag.name}</div>
											<div class="text-xs text-gray-400">Click to add</div>
										</button>
									{/each}
									{#if !filteredTags.map((tag) => tag.name).includes(tagSerachString)}
										<button
											class="flex flex-col gap-1 overflow-y-hidden rounded-md p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											on:click={createTag}
											bind:this={tagButtons[filteredTags.length]}
										>
											<div class="text-sm font-medium">
												{#if filteredTags.length > 0}
													None of the above
												{:else}
													No tags found
												{/if}
											</div>
											<div class="text-left text-xs text-gray-400">
												Create new tag:
												<span class="font-bold text-black">
													{tagSerachString}
												</span>
											</div>
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<div class="mt-2 flex flex-row flex-wrap items-start justify-start gap-2">
							{#each selectedTagNames as tagName (tagName)}
								<button
									class="h-min overflow-y-hidden whitespace-nowrap rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-400 disabled:cursor-not-allowed disabled:opacity-30"
									on:click={async () => {
										selectedTags = selectedTags.filter((tag) => tag.name !== tagName);

										await tick();
										superValidate($form, BookmarkPayload).then((result) => {
											$errors.tag_ids = result.errors.tag_ids;
										});
									}}
								>
									# {tagName}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="ml-1 inline-block h-3 w-3"
										viewBox="0 0 20 20"
										fill="#333"
									>
										<path
											fill-rule="evenodd"
											d="M3.293 3.293a1 1 0 011.414 0L10 8.586l5.293-5.293a1 1 0 111.414 1.414L11.414 10l5.293 5.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 3.293 4.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							{/each}
						</div>

						<ErrorMessage message={$errors.tag_ids} />
					</label>

					<div class="mb-2 text-sm font-medium text-gray-900">
						<div class="flex items-center">
							Incognito Mode
							<label class="relative ml-2 inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									class="peer sr-only"
									bind:checked={$form.incognito}
									{...$constraints.incognito}
									on:change={() => {
										superValidate($form, BookmarkPayload).then((result) => {
											$errors.incognito = result.errors.incognito;
										});
									}}
								/>
								<div
									class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-main peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"
								/>
							</label>
						</div>
						<ErrorMessage message={$errors.incognito} />
					</div>
				</div>
				<div class="flex justify-end">
					<button
						on:click={async () => {
							const result = await superValidate($form, BookmarkPayload);
							if (!result.valid) {
								$errors = result.errors;
								return;
							}

							isSubmitting = true;

							api
								.addBookmark($form, {
									withCredentials: true,
								})
								.then((resp) => {
									console.log(resp);
									success = true;
								})
								.catch((err) => {
									console.log(err);
									success = false;
								})
								.finally(() => {
									isSubmitting = false;
									mode = ExtensionMode.ShowResult;
									strokeOffset.set(25);
								});
						}}
						class=" flex w-full items-center justify-center rounded-lg bg-main px-4 py-2 text-sm font-medium text-white hover:bg-hover focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
						class:disabled={isSubmitting}
					>
						{#if isSubmitting}
							<svg
								aria-hidden="true"
								class="mr-2 h-4 w-4 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
								viewBox="0 0 100 101"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								><path
									d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
									fill="currentColor"
								/><path
									d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
									fill="currentFill"
								/></svg
							>
						{/if}
						Add
					</button>
				</div>
			</div>
		</div>
	{:else if mode === ExtensionMode.ShowLoginLink}
		<div class="flex h-24 w-full flex-col items-center justify-center">
			<button
				class="rounded-lg bg-main px-4 py-2 text-sm font-bold text-white hover:bg-hover focus:outline-none focus:ring-4 focus:ring-blue-300"
				on:click={() => {
					window.open(env.PUBLIC_LOGIN_URL, "_blank");
				}}
			>
				Login to add bookmarks
			</button>
		</div>
	{:else if mode === ExtensionMode.ShowResult}
		<div class="my-2 flex h-24 w-full flex-col items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				{#if success}
					<svg
						class="h-12 w-12 text-green-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						style="stroke-dashoffset: {$strokeOffset}; stroke-dasharray: 50"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<div class="text-center text-gray-600 dark:text-gray-400">
						Bookmark added successfully.
					</div>
				{:else}
					<svg
						class="h-12 w-12 text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						style="stroke-dashoffset: {$strokeOffset}; stroke-dasharray: 50"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<div class="text-center text-gray-600 dark:text-gray-400">
						Bookmark could not be added.
					</div>
				{/if}
			</div>
		</div>
	{:else if mode === ExtensionMode.ShowInitializing}
		<div class="my-2 flex h-24 w-full items-center justify-center">
			<svg
				aria-hidden="true"
				class="mr-2 h-4 w-4 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
				viewBox="0 0 100 101"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				><path
					d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
					fill="currentColor"
				/><path
					d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
					fill="currentFill"
				/></svg
			>
			<div class="text-center text-gray-600 dark:text-gray-400">Initializing...</div>
		</div>
	{/if}
</div>
