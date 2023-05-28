const div = document.createElement("div");
div.classList.add("extension-enabled");
div.style.display = "none";

document.body.appendChild(div);

window.addEventListener("open-incognito", async (e) => {
	await chrome.runtime.sendMessage({ url: e.detail.url });
});
