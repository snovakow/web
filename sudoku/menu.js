const headerHeight = 32;
const iconSize = headerHeight;
const buttonSize = 48;

const mainBar = document.createElement('DIV');
const toolBar = document.createElement('DIV');
const pickerBar = document.createElement('DIV');
const autoBar = document.createElement('DIV');

mainBar.style.position = 'absolute';
mainBar.style.height = iconSize + 'px';
mainBar.style.display = 'flex';
mainBar.style.flexDirection = 'row';
mainBar.style.flexWrap = 'nowrap';

toolBar.style.position = 'absolute';
toolBar.style.height = iconSize + 'px';
toolBar.style.display = 'flex';
toolBar.style.flexDirection = 'row';
toolBar.style.flexWrap = 'nowrap';

pickerBar.style.position = 'absolute';
pickerBar.style.display = 'flex';
pickerBar.style.gap = '8px';
pickerBar.style.flexWrap = 'nowrap';

pickerBar.style.height = buttonSize + 'px';
pickerBar.style.flexDirection = 'row';
const pickerBarLandscape = (state) => {
	if (state) {
		pickerBar.style.removeProperty('width');
		pickerBar.style.height = buttonSize + 'px';
		pickerBar.style.flexDirection = 'row';
	} else {
		pickerBar.style.removeProperty('height');
		pickerBar.style.width = buttonSize + 'px';
		pickerBar.style.flexDirection = 'column';
	}
}

autoBar.style.position = 'absolute';
autoBar.style.display = 'flex';
autoBar.style.flexWrap = 'nowrap';
const autoBarLandscape = (state) => {
	if (state) {
		autoBar.style.flexDirection = 'row';
	} else {
		autoBar.style.flexDirection = 'column';
	}
}

const createIcon = (src, size = iconSize) => {
	const backing = document.createElement("DIV");
	backing.style.width = size + "px";
	backing.style.height = size + "px";

	const ratio = size * 0.8;
	const icon = new Image();
	icon.src = src;
	icon.style.position = "relative";
	icon.style.left = "50%";
	icon.style.top = "50%";
	icon.style.width = ratio + "px";
	icon.style.height = ratio + "px";
	icon.style.transform = "translate(-50%, -50%)";
	backing.appendChild(icon);

	return backing;
}

const backing = document.createElement('DIV');
backing.style.position = 'absolute';
backing.style.display = 'flex';
backing.style.flexDirection = 'column';
backing.style.flexWrap = 'nowrap';
backing.style.left = '0%';
backing.style.background = 'white';
backing.style.border = '1px solid gray';
backing.style.padding = '4px';
backing.style.overflowY = 'auto';
backing.style.boxSizing = "border-box";

const menu = createIcon("./icons/menu.svg");
const reset = createIcon("./icons/replay.svg");
const newPuzzle = createIcon("./icons/add.svg");
menu.title = "Menu";
reset.title = "Restart Puzzle";
newPuzzle.title = "New Puzzle";

class MenuItem {
	constructor(title) {
		this.title = title;
		this.view = document.createElement('span');
	}
}
const menuMap = new Map();
let menuResponse = null;
const setMenuReponse = (response) => {
	menuResponse = response;
}
const setMenuItem = (strategy) => {
	const item = menuMap.get(strategy);
	if (!item) return;

	for (const item of menuMap.values()) {
		item.view.style.background = null;
	}
	item.view.style.background = 'LightCyan';
}
const addMenuItem = (title, strategy) => {
	const item = new MenuItem(title);

	if (backing.firstChild) item.view.style.borderTop = '1px solid lightgray';
	item.view.style.padding = '4px';

	item.view.style.whiteSpace = 'nowrap';
	item.view.style.font = '18px sans-serif';
	item.view.appendChild(document.createTextNode(title));

	item.view.addEventListener("click", () => {
		if (!menuResponse) return;
		if (!menuResponse(strategy, title)) return;
		setMenuItem(strategy);
	});

	backing.appendChild(item.view);

	menuMap.set(strategy, item);
}
addMenuItem("Hidden Single", 'simple_hidden');
addMenuItem("Intersection Removal", 'simple_omission');
addMenuItem("Naked Single", 'simple_naked');
addMenuItem("Basic Candidtates", 'candidate_visible');
addMenuItem("Naked Pair", 'candidate_naked2');
addMenuItem("Naked Triple", 'candidate_naked3');
addMenuItem("Naked Quad", 'candidate_naked4');
addMenuItem("Hidden Single", 'candidate_hidden1');
addMenuItem("Hidden Pair", 'candidate_hidden2');
addMenuItem("Hidden Triple", 'candidate_hidden3');
addMenuItem("Hidden Quad", 'candidate_hidden4');
addMenuItem("Intersection Removal (Omissions)", 'candidate_omissions');
addMenuItem("Deadly Pattern (Unique Rectangle)", 'candidate_uniqueRectangle');
addMenuItem("Y Wing", 'candidate_yWing');
addMenuItem("XYZ Wing", 'candidate_xyzWing');
addMenuItem("X Wing", 'candidate_xWing');
addMenuItem("Swordfish", 'candidate_swordfish');
addMenuItem("Jellyfish", 'candidate_jellyfish');
addMenuItem("Other Strategies", 'super_min');
addMenuItem("Difficult", 'super_max');

const menuTitle = (strategy) => {
	return menuMap.get(strategy)?.title ?? "";
}

mainBar.appendChild(menu);
mainBar.appendChild(newPuzzle);
mainBar.appendChild(reset);

const markerButton = createIcon("./icons/edit.svg", buttonSize);
const deleteButton = createIcon("./icons/eraser.svg", buttonSize);
deleteButton.title = "Clear";
pickerBar.appendChild(markerButton);
pickerBar.appendChild(deleteButton);

const undoIcons = {
	undo_on: createIcon("./icons/undo.svg"),
	redo_on: createIcon("./icons/redo.svg"),
	undo_off: createIcon("./icons/undo_gray.svg"),
	redo_off: createIcon("./icons/redo_gray.svg"),
};
toolBar.appendChild(undoIcons.undo_on);
toolBar.appendChild(undoIcons.undo_off);
toolBar.appendChild(undoIcons.redo_on);
toolBar.appendChild(undoIcons.redo_off);

if (document.fullscreenEnabled) {
	const fullscreen = createIcon("./icons/fullscreen.svg");
	const fullscreenExit = createIcon("./icons/fullscreen_exit.svg");
	fullscreen.title = "Full Screen";
	fullscreenExit.title = "Exit Full Screen";

	toolBar.appendChild(fullscreen);
	toolBar.appendChild(fullscreenExit);

	const updateFullscreen = () => {
		if (document.fullscreenElement) {
			fullscreen.style.display = 'none';
			fullscreenExit.style.display = 'block';
		} else {
			fullscreen.style.display = 'block';
			fullscreenExit.style.display = 'none';
		}
	}
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}
	updateFullscreen();

	fullscreen.addEventListener("click", () => {
		toggleFullscreen();
	});
	fullscreenExit.addEventListener("click", () => {
		toggleFullscreen();
	});
	document.addEventListener("fullscreenchange", () => {
		updateFullscreen();
	});
	document.addEventListener("fullscreenerror", () => {
		updateFullscreen();
	});
}

export { backing, mainBar, toolBar, pickerBar, autoBar, headerHeight };
export { newPuzzle, reset, settings, menu, markerButton, deleteButton };
export {
	pickerBarLandscape, autoBarLandscape, setMenuItem, setMenuReponse,
	menuTitle, undoIcons
};
