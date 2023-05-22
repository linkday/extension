const div = document.createElement("div");
div.classList.add("extension-enabled");
div.style.display = "none";

document.body.appendChild(div);

window.addEventListener("open-incognito", async (e) => {
	console.log("open-incognito", e.detail.url);
	await chrome.runtime.sendMessage({ url: e.detail.url });
});
