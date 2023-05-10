import { superValidate } from "sveltekit-superforms/server";
import { api } from "../api";
import { schemas, type TagsResponse } from "../api/api.gen";
import { ExtensionMode } from "../models/extension-mode";
import { building } from "$app/environment";

export const prerender = true;

export const load = async () => {
	let mode = ExtensionMode.ShowForm;
	const form = await superValidate(schemas.BookmarkPayload);
	let tags: TagsResponse = {
		data: [],
	};

	if (building) {
		mode = ExtensionMode.ShowInitializing;
	} else {
		try {
			tags = await api.getTags({
				withCredentials: true,
			});
		} catch (e) {
			console.error(e);
			mode = ExtensionMode.ShowLoginLink;
		}
	}

	return {
		mode,
		form,
		tags,
	};
};
