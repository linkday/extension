import { superValidate } from "sveltekit-superforms/server";
import { schemas } from "../api/api.client";
import { api } from "../api";

export const prerender = true;

export const load = async () => {
	const form = await superValidate(schemas.BookmarkPayload);
	const tags = await api.getTags();

	// TODO: this is a workaround for mock server, remove it when real server is ready
	for (let i = 0; i < tags.data.length; i++) {
		tags.data[i].name = tags.data[i].name.substring(0, 5);
	}

	return {
		form,
		tags,
	};
};
