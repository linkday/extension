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

	export let data;

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
</script>

<svelte:window on:click={handleClickEvent} />

<div class="min-w-[360px]">
	{#if data.mode === ExtensionMode.ShowForm}
		<div class="mb-4 flex flex-col p-8">
			<div class="mb-12 text-4xl font-bold">Add Bookmark</div>
			<div class="grid grid-flow-row gap-4">
				<div class="flex flex-col gap-2">
					<label class="text-md mb-2 block font-medium text-gray-900">
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

					<label class="text-md mb-2 block font-medium text-gray-900">
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
								class="absolute max-w-[calc(100vw-4rem)] md:max-w-[35%]"
								bind:this={selectTagPanel}
								on:keydown={onTagKeyDown}
							>
								<div class="flex flex-col rounded-lg border border-gray-300 bg-white p-2 shadow-md">
									{#if !filteredTags.map((tag) => tag.name).includes(tagSerachString)}
										<button
											class="flex flex-col gap-1 overflow-y-hidden rounded-md p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
											on:click={createTag}
											bind:this={tagButtons[0]}
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
									{#each filteredTags as tag, index (index)}
										<button
											class="flex flex-col gap-1 overflow-y-hidden rounded-md p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
											on:click={() => addTag(tag)}
											disabled={selectedTagNames.includes(tag.name)}
											bind:this={tagButtons[index + 1]}
										>
											<div class="text-left text-sm font-medium">{tag.name}</div>
											<div class="text-xs text-gray-400">Click to add</div>
										</button>
									{/each}
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
				</div>
				<div class="flex justify-end">
					<button
						on:click={async () => {
							const result = await superValidate($form, BookmarkPayload);
							if (!result.valid) {
								$errors = result.errors;
								return;
							}

							api
								.addBookmark($form, {
									withCredentials: true,
								})
								.then((resp) => {
									console.log(resp);
									// goto("/bookmarks");
								})
								.catch((err) => {
									console.log(err);
								});
						}}
						class=" w-full rounded-lg bg-main px-4 py-2 text-sm font-medium text-white hover:bg-hover focus:outline-none focus:ring-4 focus:ring-blue-300"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	{:else if data.mode === ExtensionMode.ShowLoginLink}
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
	{/if}
</div>
