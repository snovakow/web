const birth = new Date("2013-07-18T12:38:00.000-04:00");

const displayBacking = document.createElement('div');
displayBacking.className = "mainBacking";

document.body.appendChild(displayBacking);

const display = document.createElement('div');
display.className = "mainContainer";

displayBacking.appendChild(display);

const makeNumber = () => {
	const backing = document.createElement('span');
	backing.className = 'number';
	return backing;
}
const makeText = (text) => {
	const backing = document.createElement('span');
	backing.appendChild(document.createTextNode(text));
	return backing;
}
const add = (parent, ...args) => {
	const backing = document.createElement('div');
	for (const arg of args) backing.appendChild(arg);
	parent.appendChild(backing);
	return backing;
}

const output = "Born " + birth.toLocaleString(undefined, {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
});

const titleBacking = document.createElement('div');
titleBacking.className = 'titleBacking';
display.appendChild(titleBacking);

const title = document.createElement('span');
title.appendChild(document.createTextNode("Raya Papaya"));
title.className = 'title';
titleBacking.appendChild(title);

const subtitle = add(display, makeText(output));
subtitle.className = 'subtitle';

const leadup = "Raya Papaya is... ";

const statsBacking = document.createElement('div');
statsBacking.className = 'statsBacking';
const stats = document.createElement('div');
stats.className = 'stats';
statsBacking.appendChild(stats);

const ageHolder = makeNumber();
const monthAgeHolder = makeNumber();
const weeksHolder = makeNumber();
const daysHolder = makeNumber();
const hoursHolder = makeNumber();
const minutesHolder = makeNumber();
const secondsHolder = makeNumber();
add(stats, makeText(leadup), ageHolder, makeText(" years old")).className = 'stat';
add(stats, makeText(leadup), monthAgeHolder, makeText(" months old")).className = 'stat';
add(stats, makeText(leadup), weeksHolder, makeText(" weeks old")).className = 'stat';
add(stats, makeText(leadup), daysHolder, makeText(" days old")).className = 'stat';
add(stats, makeText(leadup), hoursHolder, makeText(" hours old")).className = 'stat';
add(stats, makeText(leadup), minutesHolder, makeText(" minutes old")).className = 'stat';
add(stats, makeText(leadup), secondsHolder, makeText(" seconds old")).className = 'stat';

display.appendChild(statsBacking);

const exactAgeHolder = document.createElement('div');
exactAgeHolder.className = 'exactAge';

const exactAgeSub = makeText("years old!!!");
exactAgeSub.className = 'exactAgeSub';

const exactAgeContainer = add(display, exactAgeHolder, exactAgeSub);
exactAgeContainer.className = 'exactAgeContainer';

const prevValues = new Map();

function step(timeStamp) {
	const now = new Date();
	const diff = now - birth;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	let weeks = Math.floor(days / 7);
	const years = now.getFullYear() - birth.getFullYear();

	const monthDiff = now.getMonth() - birth.getMonth();
	let monthAge = (years * 12) + monthDiff;

	let age = years;
	let percent;
	const birthday = new Date(birth);
	birthday.setFullYear(now.getFullYear());
	if (birthday > now) {
		const previousBirthday = new Date(birthday);
		previousBirthday.setFullYear(now.getFullYear() - 1);
		percent = (now - previousBirthday) / (birthday - previousBirthday);
		age--;
		monthAge--;
	} else {
		const nextBirthday = new Date(birthday);
		nextBirthday.setFullYear(now.getFullYear() + 1);
		percent = (now - birthday) / (nextBirthday - birthday);
	}

	const exactAge = age + percent;

	const applyChanged = (key, element, getter) => {
		const value = getter();
		const prevValue = prevValues.get(key);
		if (value !== prevValue) {
			element.innerText = value;
			prevValues.set(key, value);
		}
	}

	applyChanged('seconds', secondsHolder, () => seconds.toLocaleString());
	applyChanged('minutes', minutesHolder, () => minutes.toLocaleString());
	applyChanged('hours', hoursHolder, () => hours.toLocaleString());
	applyChanged('days', daysHolder, () => days.toLocaleString());
	applyChanged('weeks', weeksHolder, () => weeks.toLocaleString());
	applyChanged('monthAge', monthAgeHolder, () => monthAge.toLocaleString());
	applyChanged('age', ageHolder, () => age.toLocaleString());
	applyChanged('exactAge', exactAgeHolder, () => exactAge.toFixed(8));

	window.requestAnimationFrame(step);
}

step();

const resize = () => {
	const max = 576;
	const width = window.innerWidth;
	display.style.transform = "translateX(-50%)";

	const scale = width / max;
	if (width < max) display.style.transform += ` scale(${scale})`;
}
resize();
window.addEventListener('resize', resize);
