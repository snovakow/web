const headerHeight = 40;
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

const menu = createIcon("./icons/menu_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
const reset = createIcon("./icons/replay_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
const newPuzzle = createIcon("./icons/add_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
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
		if (menuResponse) menuResponse(strategy);
	});

	backing.appendChild(item.view);

	menuMap.set(strategy, item);
}
addMenuItem("Naked Pair", 'naked2');
addMenuItem("Naked Triple", 'naked3');
addMenuItem("Naked Quad", 'naked4');
addMenuItem("Hidden Single", 'hidden1');
addMenuItem("Hidden Pair", 'hidden2');
addMenuItem("Hidden Triple", 'hidden3');
addMenuItem("Hidden Quad", 'hidden4');
addMenuItem("Intersection Removal (Omissions)", 'omissions');
addMenuItem("Deadly Pattern (Unique Rectangle)", 'uniqueRectangle');
addMenuItem("Y Wing", 'yWing');
addMenuItem("XYZ Wing", 'xyzWing');
addMenuItem("X Wing", 'xWing');
addMenuItem("Swordfish", 'swordfish');
addMenuItem("Jellyfish", 'jellyfish');

const menuTitle = (strategy) => {
	return menuMap.get(strategy)?.title ?? "";
}

mainBar.appendChild(menu);
mainBar.appendChild(newPuzzle);
mainBar.appendChild(reset);

const infoButton = createIcon("./icons/question_mark_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
infoButton.title = "Info";
mainBar.appendChild(infoButton);

const markerButton = createIcon("./icons/edit_48dp_000000_FILL0_wght400_GRAD0_opsz48.svg", buttonSize);
const deleteButton = createIcon("./icons/disabled_by_default_48dp_000000_FILL0_wght400_GRAD0_opsz48.svg", buttonSize);
deleteButton.title = "Clear (delete)";
pickerBar.appendChild(markerButton);
pickerBar.appendChild(deleteButton);

const checkButton = createIcon("./icons/check_box_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
checkButton.title = "Check Puzzle";
toolBar.appendChild(checkButton);

const undoIcons = {
	undo_on: createIcon("./icons/undo_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg"),
	redo_on: createIcon("./icons/redo_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg"),
	undo_off: createIcon("./icons/undo_40dp_D3D3D3_FILL0_wght400_GRAD0_opsz40.svg"),
	redo_off: createIcon("./icons/redo_40dp_D3D3D3_FILL0_wght400_GRAD0_opsz40.svg"),
};
undoIcons.undo_on.title = "Undo";
undoIcons.undo_off.title = "Undo";
undoIcons.redo_on.title = "Redo";
undoIcons.redo_off.title = "Redo";

toolBar.appendChild(undoIcons.undo_on);
toolBar.appendChild(undoIcons.undo_off);
toolBar.appendChild(undoIcons.redo_on);
toolBar.appendChild(undoIcons.redo_off);

if (document.fullscreenEnabled) {
	const fullscreen = createIcon("./icons/fullscreen_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
	const fullscreenExit = createIcon("./icons/fullscreen_exit_40dp_000000_FILL0_wght400_GRAD0_opsz40.svg");
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

	// fullscreen.style.display = "none";
}

menu.style.display = "none";
markerButton.style.display = "none";
autoBar.style.display = "none";
infoButton.style.display = "none";
checkButton.style.display = "none";
newPuzzle.style.display = "none";

export { backing, mainBar, toolBar, pickerBar, autoBar, headerHeight, buttonSize };
export { newPuzzle, reset, menu, markerButton, deleteButton, infoButton, checkButton };
export {
	pickerBarLandscape, autoBarLandscape, setMenuItem, setMenuReponse,
	menuTitle, undoIcons
};
