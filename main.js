const initialize = (args = {}) => {
	args.main = args.main ?? false;
	args.gtag = args.gtag ?? false;
	args.css = args.css ?? false;

	let version = "0";
	if (args.main) {
		const url = new URL(args.main);
		const search = new URLSearchParams(url.search);
		version = [...search.keys()][0];
	}
	console.log("App Version: " + version);

	const lead = document.head.children[0];
	if (args.gtag) {
		const ga = document.createElement('script');
		ga.async;
		ga.src = `https://www.googletagmanager.com/gtag/js?id=${args.gtag}`;

		const gtag = document.createElement('script');
		gtag.textContent = `
			window.dataLayer = window.dataLayer || [];
			function gtag() { dataLayer.push(arguments); }
			gtag('js', new Date());
		
			gtag('config', '${args.gtag}');
		`;

		document.head.insertBefore(ga, lead);
		document.head.insertBefore(gtag, lead);
	}

	if (args.css) {
		let array = args.css;
		if (typeof array === "string") array = [array];
		for (const css of array) {
			const link = document.createElement('link');
			link.rel = "stylesheet";
			link.href = css + "?" + version;
			document.head.insertBefore(link, lead);
		}
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
