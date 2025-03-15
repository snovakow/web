const addLink = (title, link) => {
	const a = document.createElement('a');
	a.href = link;
	a.appendChild(document.createTextNode(title));
	a.style.display = 'inline';
	document.body.appendChild(a);
	document.body.appendChild(document.createElement('br'));
};

const iframe = document.createElement('iframe');
iframe.id = "iframe";
iframe.src = "./snovakow/sudoku.html";
iframe.style.width = "100%";
// iframe.style.overflow = 'hidden';
iframe.style.border = 0;
document.body.appendChild(iframe);

addLink("Singles", "./sudoku/");

addLink("Naked Pair", "./sudoku/?strategy=naked2");
addLink("Naked Triple", "./sudoku/?strategy=naked3");
addLink("Naked Quad", "./sudoku/?strategy=naked4");
addLink("Hidden Single", "./sudoku/?strategy=hidden1");
addLink("Hidden Pair", "./sudoku/?strategy=hidden2");
addLink("Hidden Triple", "./sudoku/?strategy=hidden3");
addLink("Hidden Quad", "./sudoku/?strategy=hidden4");
addLink("Intersection Removal", "./sudoku/?strategy=omissions");
addLink("Deadly Pattern", "./sudoku/?strategy=uniqueRectangle");
addLink("Y Wing", "./sudoku/?strategy=yWing");
addLink("XYZ Wing", "./sudoku/?strategy=xyzWing");
addLink("X Wing", "./sudoku/?strategy=xWing");
addLink("Swordfish", "./sudoku/?strategy=swordfish");
addLink("Jellyfish", "./sudoku/?strategy=jellyfish");

addLink("Sudoku About", "./sudoku/about.html");
// addLink("Bounder", "/bounder/");

// addLink("Resume", "/resume/");
// addLink("LinkedIn", "https://www.linkedin.com/in/snovakow/");

function resizeIFrameToFitContent() {
	const iframe = document.getElementById('iframe');

	// iframe.contentWindow.document.body.style.whiteSpace = 'nowrap';

	const margin = parseInt(window.getComputedStyle(iframe.contentDocument.body).margin);
	// iframe.style.width = iframe.contentWindow.document.body.scrollWidth+margin+margin + "px";
	iframe.style.height = iframe.contentWindow.document.body.scrollHeight + margin + margin + "px";

	// iframe.contentWindow.document.body.style.height="100%";
	console.log(iframe.contentWindow.document.body.scrollWidth);
	console.log(iframe.contentWindow.document.body.scrollHeight);

	console.log(margin);
}
iframe.onload = resizeIFrameToFitContent

window.addEventListener('DOMContentLoaded', function (e) {
	document.body.appendChild(iframe.contentWindow.document.body)
	console.log("DOMContentLoaded");
	// resizeIFrameToFitContent();
});
// resizeIFrameToFitContent();