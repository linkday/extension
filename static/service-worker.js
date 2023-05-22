chrome.runtime.onMessage.addListener((request) => {
	if (request.url) {
		chrome.windows.create({
			url: request.url,
			incognito: true,
		});
	}
});
