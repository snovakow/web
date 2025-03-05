const blocker = document.createElement('div');
blocker.style.position = 'absolute';
blocker.style.left = '0%';
blocker.style.top = '0%';
blocker.style.width = '100%';
blocker.style.height = '100%';
blocker.style.background = 'rgba(0,0,0,0.5)';

blocker.style.fontSize = 18 + 'px';
blocker.style.fontFamily = 'sans-serif';
// blocker.onclick = (event) => {
//     if (event.target === blocker) closeBlocker();
// }

let activePanel = null;

const closeBlocker = () => {
    if (blocker.parentElement) blocker.parentElement.removeChild(blocker);
    if (!activePanel) return;
    activePanel.close();
    activePanel = null;
};

class ActivePanel {
    constructor(panel) {
        closeBlocker();

        this.panel = panel;

        blocker.appendChild(panel);
        document.body.appendChild(blocker);
    }
    close() {
        if (this.panel.parentElement === blocker) blocker.removeChild(this.panel);
    }
}

const footerHeight = 48;
const borderWidth = 3;
const margin = 32;
const windowMargin = 48;

export class Panel {
    static alert(message, confirm) {
        const panel = new Panel(confirm);
        panel.show(message);
    }
    static confirm(message, confirm) {
        const panel = new Panel(confirm, true);
        panel.show(message, confirm, true);
    }
    constructor(confirm, reject = false) {
        const frame_src = (typeof confirm === 'string') ? confirm : null;
        if (frame_src) {
            confirm = null;
            this.frame = true;
        } else {
            this.frame = false;
        }


        this.container = document.createElement('div');
        this.content = document.createElement(frame_src ? 'iframe' : 'div');

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

        if (frame_src) {
            container.style.display = 'none';

            content.style.overflow = 'visible';
            content.src = frame_src;
        } else {
            content.style.overflow = 'auto';
            content.style.padding = margin + 'px';
        }

        content.style.position = 'absolute';
        content.style.top = '0px';
        content.style.borderBottom = '1px solid rgba(0,0,0,0.5)';
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
            closeBlocker();
            if (confirm) confirm(true);
        };
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
                closeBlocker();
                if (confirm) confirm(false);
            };
            container.appendChild(rejectButton);

            confirmButton.style.right = margin + 'px';
            confirmButton.style.transform = 'translate(0%, 50%)';
        } else {
            confirmButton.style.left = '50%';
            confirmButton.style.transform = 'translate(-50%, 50%)';
        }
        container.appendChild(confirmButton);
    }
    show(message) {
        activePanel = new ActivePanel(this.container);

        const container = this.container;
        const content = this.content;

        const inset = margin * 2;
        let setSizeFrame = null;
        if (this.frame) {
            const frame = this.content;

            const setWidth = () => {
                const max = window.innerWidth - windowMargin;
                let fixedWidth = Math.min(max, 640);
                container.style.width = fixedWidth + 'px';
                frame.style.width = fixedWidth + 'px';
            };
            setWidth();

            let loaded = false;
            setSizeFrame = () => {
                if (!container.parentElement) return;
                if (!loaded) return;

                setWidth();

                const body = frame.contentWindow.document.body;
                const html = body.parentElement;
                const scroll = html.scrollTop;

                const max = window.innerHeight - windowMargin - footerHeight;
                frame.style.height = frame.contentWindow.document.body.scrollHeight + inset + 'px';

                let height = frame.contentWindow.document.body.scrollHeight + inset;

                if (height > max) height = max;

                container.style.height = height + footerHeight + 'px';
                frame.style.height = height + 'px';

                html.scrollTop = scroll;
            };
            frame.onload = () => {
                loaded = true;
                container.style.display = 'block';
                frame.contentWindow.document.body.style.margin = margin + 'px';
                setSizeFrame();
            };
        } else {
            content.appendChild(document.createTextNode(message));
        }
        setSize = () => {
            const maxWidth = window.innerWidth - windowMargin;
            if (this.frame) {
                setSizeFrame();
            } else {
                const fixedWidth = Math.min(320, maxWidth);
                content.style.width = fixedWidth - inset + 'px';
                content.style.height = '0px';
                container.style.width = fixedWidth + 'px';

                const fullHeight = content.scrollHeight - inset;
                const maxHeight = window.innerHeight - windowMargin;
                const fixedHeight = Math.min(fullHeight, maxHeight);
                content.style.height = fixedHeight + 'px';

                const containerHeight = fixedHeight + footerHeight + inset;
                container.style.height = containerHeight + 'px';
            }
        };

        window.addEventListener('resize', setSize);
        setSize();
    }
}
