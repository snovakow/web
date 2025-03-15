const blocker = document.createElement('div');
blocker.style.position = 'absolute';
blocker.style.left = '0%';
blocker.style.top = '0%';
blocker.style.width = '100%';
blocker.style.height = '100%';
blocker.style.background = 'rgba(0,0,0,0.5)';
blocker.style.zIndex = 1;

const footerHeight = 48;
const borderWidth = 3;
const margin = 32;
const windowMargin = 48 * 2;

const domParent = document.body;

class PanelBase {
    constructor(contentElement, confirm = null, reject = false) {
        this.confirm = confirm;
        this.active = false;

        this.confirmButton = null;
        this.rejectButton = null;

        this.resizeListener = null;
        this.keydownListener = null;
        this.keyupListener = null;

        this.container = document.createElement('div');
        this.content = contentElement;

        const container = this.container;
        const content = this.content;

        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.background = 'hsl(0 100% 99%)';
        container.style.border = borderWidth + 'px solid black';
        container.style.borderRadius = '8px';
        container.style.overflow = 'clip';
        container.style.pointerEvents = "auto";
        container.style.fontSize = 18 + 'px';
        container.style.fontFamily = 'sans-serif';

        content.style.position = 'absolute';
        content.style.top = '0px';
        content.style.borderBottom = '1px solid rgba(0,0,0,0.25)';
        content.style.borderTop = 'none';
        content.style.borderLeft = 'none';
        content.style.borderRight = 'none';
        content.style.background = 'white';
        content.style.color = 'black';

        container.appendChild(content);

        const buttonInset = 8;
        const buttonSize = footerHeight - buttonInset * 2;
        const bottom = footerHeight * 0.5;
        const confirmButton = document.createElement('button');
        confirmButton.style.position = 'absolute';
        confirmButton.style.bottom = bottom + 'px';
        confirmButton.style.height = buttonSize + 'px';
        confirmButton.style.width = buttonSize * 2 + 'px';

        if (reject) {
            const bold = document.createElement('span');
            bold.style.fontWeight = 'bold';
            bold.appendChild(document.createTextNode("OK"));
            confirmButton.appendChild(bold);
        } else {
            confirmButton.appendChild(document.createTextNode("Close"));
        }
        confirmButton.onclick = (event) => {
            event.stopPropagation();
            this.hide();
            if (confirm) confirm(true);
        };

        this.confirmButton = confirmButton;
        if (reject) {
            const rejectButton = document.createElement('button');
            rejectButton.style.position = 'absolute';
            rejectButton.style.bottom = bottom + 'px';
            rejectButton.style.height = buttonSize + 'px';
            rejectButton.style.width = buttonSize * 2 + 'px';
            rejectButton.style.left = margin + 'px';
            rejectButton.style.transform = 'translate(0%, 50%)';

            rejectButton.appendChild(document.createTextNode("Cancel"));
            rejectButton.onclick = (event) => {
                event.stopPropagation();
                this.hide();
                if (confirm) confirm(false);
            };

            container.appendChild(rejectButton);
            confirmButton.style.right = margin + 'px';
            confirmButton.style.transform = 'translate(0%, 50%)';

            this.rejectButton = rejectButton;
        } else {
            confirmButton.style.left = '50%';
            confirmButton.style.transform = 'translate(-50%, 50%)';
        }
        container.appendChild(confirmButton);
    }
    setWidth(min, inset = 0) {
        const maxWidth = window.innerWidth - windowMargin;
        const fixedWidth = Math.min(maxWidth, min);
        this.container.style.width = fixedWidth + 'px';
        this.content.style.width = fixedWidth - inset + 'px';
    }
    handleEvent(event) {
        if (event.type !== 'resize') return;
        if (this.setSize) this.setSize();
    }
    show() {
        if (this.active) return false;
        this.active = true;

        this.keydownListener = (event) => {
            if (event.code === "Enter") {
                event.preventDefault();
                this.confirmButton.focus();
            } else if (event.code === "Escape") {
                event.preventDefault();
                const button = this.rejectButton ?? this.confirmButton;
                button.focus();
            }
        };
        document.body.addEventListener('keydown', this.keydownListener);

        this.keyupListener = (event) => {
            if (event.code === "Enter") {
                if (document.activeElement === this.confirmButton) {
                    event.preventDefault();
                    this.confirmButton.click();
                }
            } else if (event.code === "Escape") {
                const button = this.rejectButton ?? this.confirmButton;
                if (document.activeElement === button) {
                    event.preventDefault();
                    button.click();
                }
            }
        };
        document.body.addEventListener('keyup', this.keyupListener);

        this.resizeListener = this;
        window.addEventListener('resize', this.resizeListener);

        domParent.appendChild(this.container);

        return true;
    }
    hide() {
        if (!this.active) return false;
        this.active = false;

        if (this.keydownListener) {
            document.body.removeEventListener('keydown', this.keydownListener);
            this.keydownListener = null;
        }
        if (this.keyupListener) {
            document.body.removeEventListener('keyup', this.keyupListener);
            this.keyupListener = null;
        }
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }

        domParent.removeChild(this.container);

        return true;
    }
}

export class Panel extends PanelBase {
    constructor(message, confirm, reject) {
        const contentElement = document.createElement('div');
        super(contentElement, confirm, reject);

        this.message = message;

        this.content.style.overflow = 'auto';
        this.content.style.padding = margin + 'px';
    }
    setSize() {
        if (!this.container.parentElement) return;

        const inset = margin * 2;
        this.setWidth(320, inset);

        this.content.style.height = '0px';

        const fullHeight = this.content.scrollHeight - inset;
        const maxHeight = window.innerHeight - windowMargin;
        const fixedHeight = Math.min(fullHeight, maxHeight);
        this.content.style.height = fixedHeight + 'px';

        const containerHeight = fixedHeight + footerHeight + inset;
        this.container.style.height = containerHeight + 'px';
    }
    show() {
        if (!super.show()) return false;

        this.content.appendChild(document.createTextNode(this.message));
        this.setSize();

        return true;
    }
}

let activePanel = null;
let framePanels = 0;
export class AlertPanel extends Panel {
    static alert(message, confirm) {
        const panel = new AlertPanel(message, confirm);
        panel.show();
    }
    static confirm(message, confirm) {
        const panel = new AlertPanel(message, confirm, true);
        panel.show();
    }
    static hide() {
        if (activePanel) activePanel.hide();
    }
    constructor(...args) {
        super(...args);
        this.container.style.zIndex = 2;
    }
    show() {
        if (!super.show()) return false;

        if (activePanel) activePanel.hide();
        activePanel = this;
        if (!blocker.parentElement) domParent.appendChild(blocker);

        return true;
    }
    hide() {
        if (!super.hide()) return false;

        activePanel = null;
        if (blocker.parentElement && framePanels === 0) blocker.parentElement.removeChild(blocker);

        return true;
    }
}

export class FramePanel extends PanelBase {
    constructor(src) {
        const contentElement = document.createElement('iframe');
        super(contentElement);

        this.container.style.zIndex = 3;
        this.content.style.overflow = 'clip';
        this.content.src = src;

        this.content.onload = () => {
            this.content.contentWindow.document.body.style.margin = margin + 'px';

            framePanels++;
            if (!blocker.parentElement) domParent.appendChild(blocker);
            this.container.style.display = 'block';
            this.setSize();
        };
    }
    setSize() {
        if (!this.container.parentElement) return;

        this.setWidth(640);
        const frame = this.content;

        const body = frame.contentWindow.document.body;
        const html = body.parentElement;
        const scroll = html.scrollTop;

        const inset = margin * 2;
        const max = window.innerHeight - windowMargin - footerHeight;
        frame.style.height = frame.contentWindow.document.body.scrollHeight + inset + 'px';

        let height = frame.contentWindow.document.body.scrollHeight + inset;

        if (height > max) height = max;

        this.container.style.height = height + footerHeight + 'px';
        frame.style.height = height + 'px';

        html.scrollTop = scroll;
    }
    show() {
        if (!super.show()) return false;

        this.container.style.display = 'none';

        return true;
    }
    hide() {
        if (!super.hide()) return false;

        framePanels--;
        if (blocker.parentElement && framePanels === 0 && !activePanel) blocker.parentElement.removeChild(blocker);

        return true;
    }
}
