const page = document.createElement('div');
page.className = 'page';
document.body.appendChild(page);

const top = document.createElement('div');
top.className = 'top';
page.appendChild(top);

const titleArea = document.createElement('div');
titleArea.className = 'titleArea';
top.appendChild(titleArea);

const title = document.createElement('div');
title.className = 'title';
titleArea.appendChild(title);
const subtitle = document.createElement('div');
subtitle.className = 'subtitle';
titleArea.appendChild(subtitle);

const contact = document.createElement('div');
contact.className = 'contact';
top.appendChild(contact);

title.appendChild(document.createTextNode('Scott Novakowski'));
subtitle.appendChild(document.createTextNode('Senior Software Engineer'));

const contactLines = `+1 (647) 465-3759
snovakow@gmail.com
Toronto, ON, Canada`.split('\n');
for (const line of contactLines) {
	// let hidden = "";
	// for (let i = 0; i < line.length; i++) hidden += "x";
	contact.appendChild(document.createTextNode(line));
	contact.appendChild(document.createElement('br'));
}

const content = document.createElement('div');
content.className = 'content';
page.appendChild(content);

const addSubHeader = (text) => {
	const header = document.createElement('div');
	header.className = 'subheader';
	header.appendChild(document.createTextNode(text));
	content.appendChild(header);
}
const addHeader = (text) => {
	const header = document.createElement('div');
	header.className = 'header';
	header.appendChild(document.createTextNode(text));
	content.appendChild(header);
}
const addParagraph = (text) => {
	const paragraph = document.createElement('div');
	paragraph.className = 'paragraph';
	paragraph.appendChild(document.createTextNode(text));
	content.appendChild(paragraph);
}
const link = (url, title) => {
	title ??= url;
	const a = document.createElement('a');
	a.href = url;
	a.textContent = title;
	a.target = "_blank";
	return a;
}
const createItem = (item) => {
	if (Array.isArray(item)) {
		const ul = document.createElement('ul');
		ul.className = 'bulletMain';
		for (const element of item) ul.appendChild(createItem(element));
		return ul;
	}

	const li = document.createElement('li');
	li.className = 'bulletSub';

	if (typeof item === 'string') li.appendChild(document.createTextNode(item));
	else li.appendChild(item);

	return li;
}

addHeader('SUMMARY');
addParagraph('I am looking to advance my career as a software developer, expanding my scope of responsibility, and having a larger impact.');

addHeader('SKILLS');
addParagraph('I am an experienced 3D graphics programmer using OpenGL, ES2, and WebGL.');
addParagraph('I have developed applications for the Web, Mac, iPhone, and AppleTV platforms, as well as Virtual and Augmented reality.');
addParagraph('I have worked with 360° and stereoscopic VR Video encoding and rendering. I have worked with servers and have backend experience using PHP and MySQL, and have worked with live multi-user systems, and multi-client video streaming.');
addParagraph('I have supervised interns and mentored summer students throughout my career.');

addHeader('EXPERIENCE');
const boldSection = (text) => {
	const bold = document.createElement('span');
	bold.className = 'header';
	bold.appendChild(document.createTextNode(text));
	return bold;
}
const experience = createItem([
	boldSection('Senior Developer, Liquid Cinema — November 2015—Present'),
	[
		link('https://liquidcinemavr.com'),
		'Built the frontend web component of the Liquid Cinema platform, a browser native interactive cinematic 360° video based WebGL player.',
		'Heat Maps, a backend storage of user viewing directions, and frontend heat map styled visualization to represent concentrations of user viewing directions.',
		'Responsible for client side Apple iOS and tvOS components of the Liquid Cinema platform.',
		'Developed Virtual and Augmented Reality support for the web component of the Liquid Cinema platform using the WebXR standard.',

		'OMAF 360° VR Video Streaming',
		[
			'Fraunhofer HHI collaboration to integrate OMAF 360° VR video streaming into the Liquid Cinema web platform.',
			link('https://www.hhi.fraunhofer.de/en/departments/vca/technologies-and-solutions/mpeg-omaf.html'),
		],

		'"Magic of Flight" interactive VR educational experience, Lead WebXR Developer',
		[
			'Meta collaboration to create an interactive web experience for the Quest VR Headset.',
			'2021 WebXR Poly Awards winner:',
			[
				'Education Experience of the Year',
				'Video Experience of the Year',
				'Experience of the Year',
			],
			link('https://liquidcinemavr.com/fly/'),
		],

		'Multi user WebRTC live web video chat integration using PeerJS, using the Colyseus and Feathers backend systems',

		'Senior Metaverse collaborative environment frontend Lead',
		[
			'Conestoga College Collaboration.',
			'3D Avatar conferencing solution.',
			'Virtual Reality multi-user live interactive environment.',
			'Messaging and live video and screen-share streaming.',
		],
	],
	boldSection('University of Calgary; Calgary, AB — 2005—2015'),
	[
		'The Lindsay Project, Lead Programmer and Software Designer — 2009—2015',
		[
			'Funded by the department of Undergraduate Medical Education in the Cumming School of Medicine at the University of Calgary.',
			'I worked with Zygote 3D human anatomy models, originally used in Google Body, now Zygote Body, as part of a full stack pipeline for multiple applications.',
			'Developed “Zygote 3D Anatomy Atlas & Dissection Lab.”',
			[
				'iPhone application released commercially to the iTunes App Store.',
				'Currently not available, but reference videos are available:',
				link('https://www.youtube.com/@Zygote3D/videos'),
			],
			'Developed "Atlas", a 3D Human anatomy education oriented web application.',
			[
				'CBC segment on The Lindsay Project, featuring the Atlas application:',
				link('https://www.cbc.ca/news/canada/calgary/new-medical-tool-honours-u-of-c-student-s-memory-1.1240316'),
			],
		],

		'Vaccine Design and Implementation Project, University of Calgary; Calgary, AB — 2008',
		[
			'Developed interactive realtime 3D OpenGL visualizations to represent the modelling part of a vaccine design project funded through the AHFMR Interdisciplinary Team in Vaccine Design and Implementation program at the University of Calgary.',
		],

		'Swarm Art Software Developer, University of Calgary; Calgary, AB — 2005—2007',
		[
			'Artistic based apps and tools that use agent based swarm systems to generate visuals and facilitate interactive displays.',
			'Featured in:',
			[
				'Images published in the Leonardo Journal, Volume 40, issue 3, by MIT Press, 2007.',
				'Digital’06: “Bio/Med SciART” submission accepted for public display in the New York Hall of Science, 2006.',
				'Victoria Conference Center street front window interactive public display, Victoria BC, August to December 2006',
				'Discovery Channel "A Daily Planet" segment on swarm intelligence, featuring the Swarm Art system, aired on October 23, 2006.',
				'Nickle Galleries Museum interactive display, Calgary AB, 2005.',
			]
		],
	],
]);
content.appendChild(experience);

addHeader('EDUCATION');
addParagraph('University of Calgary, Calgary, AB — Bachelor of Science in Computer Science, 2006.');

const createPublication = (main, sub1a, subName, sub1b, sub2) => {
	const mainElement = document.createElement('div');
	mainElement.className = 'publicationMain';
	mainElement.appendChild(document.createTextNode(main));

	const subElement1 = document.createElement('div');
	subElement1.className = 'publicationSub1';

	subElement1.appendChild(document.createTextNode(sub1a));

	const subElementName = document.createElement('span');
	subElementName.className = 'publicationName';
	subElementName.appendChild(document.createTextNode(subName));
	subElement1.appendChild(subElementName);

	subElement1.appendChild(document.createTextNode(sub1b));

	const subElement2 = document.createElement('div');
	subElement2.className = 'publicationSub2';
	subElement2.appendChild(document.createTextNode(sub2));

	const element = document.createElement('div');
	element.appendChild(mainElement);
	element.appendChild(subElement1);
	element.appendChild(subElement2);
	return element;
}
addHeader('PUBLICATIONS');
const publications = createItem([
	createPublication(
		'LINDSAY Virtual Human: Multi-Scale, Agent-based, and Interactive',
		'C. Jacob, S. von Mammen, T. Davison, A. Sarraf-Shirazi, V. Sarpe, A. Esmaeili, D. Phillips, I. Yazdanbod, ',
		'S. Novakowski',
		', S. Steil, C. Gingras, H. Jamniczky, B. Hallgrimsson, and B. Wright.',
		'Advances in Intelligent Modelling and Simulation, Studies in Computational Intelligence Volume 422, pp 327-349; Springer-Verlag Berlin Heidelberg, 2012',
	),
	createPublication(
		'Evolutionary Swarm Design: How Can Swarm-based Systems Help to Generate and Evaluate Designs?',
		'Sebastian von Mammen, ', 'Scott Novakowski', ', Gerald Hushlak, and Christian Jacob.',
		'Design Principles and Practices: An International Journal, Volume 3, Issue 3, pp. 371-386, 2009.',
	),
	createPublication(
		'Evolutionary design of dynamic SwarmScapes',
		'Namrata Khemka, ', 'Scott Novakowski', ', Gerald Hushlak, and Christian Jacob.',
		'Genetic and Evolutionary Computation Conference, GECCO 2008, Proceedings, Atlanta, GA, USA, July 12-16, 2008.',
	),
	createPublication(
		'Motion swarms: video interaction for art in complex environments',
		'Quoc Nguyen, ', 'Scott Novakowski', ', Jeffrey E. Boyd, Christian Jacob, and Gerald Hushlak.',
		'Proceedings of the 14th annual ACM international conference on Multimedia, Santa Barbara, CA, USA, October 23-27, 2006.',
	),
]);
content.appendChild(publications);

addParagraph('References available upon request');
