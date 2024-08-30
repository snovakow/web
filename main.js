const initialize = (main, gtagId = false) => {
	const url = new URL(main);
	const search = new URLSearchParams(url.search);
	const version = [...search.keys()][0];
	console.log("App Version: " + version);

	if (gtagId) {
		const ga = document.createElement('script');
		ga.async;
		ga.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;

		const gtag = document.createElement('script');
		gtag.textContent = `
			window.dataLayer = window.dataLayer || [];
			function gtag() { dataLayer.push(arguments); }
			gtag('js', new Date());
		
			gtag('config', '${gtagId}');
		`;

		const lead = document.head.children[0];
		document.head.insertBefore(ga, lead);
		document.head.insertBefore(gtag, lead);
	}

	return new Promise((resolve) => {
		if (document.readyState === "loading") {
			document.addEventListener('DOMContentLoaded', resolve, false);
		} else {
			resolve();
		}
	});
}

export { initialize };
