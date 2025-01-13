const src = document.currentScript.src;
import("../snovakow/lib/main.js").then(
	main => {
		const gtag = (window.location.host === "snovakow.com") ? 'G-DV1KLMY93N' : false;
		const options = { main: src, gtag, css: "main.css" };
		main.initialize(options).then(() => import("./app.js"));
	}
);
