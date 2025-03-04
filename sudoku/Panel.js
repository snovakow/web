let appPanel = null;
const blocker = document.createElement('div');
blocker.style.position = 'absolute';
blocker.style.left = '0%';
blocker.style.top = '0%';
blocker.style.width = '100%';
blocker.style.height = '100%';
blocker.style.background = 'rgba(0,0,0,0.5)';

blocker.style.fontSize = 18 + 'px';
blocker.style.fontFamily = 'sans-serif';

const closeBlocker = () => {
    if (blocker?.parentElement) blocker.parentElement.removeChild(blocker);
    if (appPanel) {
        if (appPanel.parentElement === blocker) blocker.removeChild(appPanel);
        appPanel = null;
    }
};
// blocker.onclick = (event) => {
//     if (event.target === blocker) closeBlocker();
// }

const footerHeight = 48;
const borderWidth = 3;
const margin = 32;
const windowMargin = 48;

export class Panel {
    static alert(message, confirm) {
        const panel = new Panel();
        panel.show(message, confirm);
    }
    static confirm(message, confirm) {
        const panel = new Panel();
        panel.show(message, confirm, true);
    }
    constructor(src = null) {
        if (src) {
            this.content = document.createElement('iframe');
            // this.content.style.overflow = 'visible';
            this.content.style.overflow = 'clip';
            this.content.style.width = '100%';
            this.content.style.height = '100%';

            this.content.src = src;
            this.frame = this.content;
        } else {
            this.content = document.createElement('div');
            this.content.style.overflow = 'auto';
            this.content.style.padding = margin + 'px';
        }

        this.content.style.position = 'absolute';
        this.content.style.top = '0px';
        this.content.style.borderBottom = '1px solid rgba(0,0,0,0.5)';
        this.content.style.borderTop = 'none';
        this.content.style.borderLeft = 'none';
        this.content.style.borderRight = 'none';
        this.content.style.background = 'white';
        this.content.style.color = 'black';
    }
    show(message, confirm, reject = false) {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.background = 'hsl(0 100% 99%)';
        container.style.border = borderWidth + 'px solid black';
        container.style.borderRadius = '8px';
        container.style.overflow = 'clip';

        const content = this.content;

        if (this.frame) {
            container.style.display = 'none';
        }

        const inset = margin * 2;
        let setSize = null;
        if (this.frame) {
            const frame = this.frame;

            const setWidth = () => {
                const max = window.innerWidth - windowMargin;
                let fixedWidth = Math.min(max, 640);
                container.style.width = fixedWidth + 'px';
                frame.style.width = fixedWidth + 'px';
            };
            setWidth();

            let loaded = false;
            setSize = () => {
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
                setSize();
            };
        } else {
            content.appendChild(document.createTextNode(message));

            setSize = () => {
                const maxWidth = window.innerWidth - windowMargin;
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
            };
        }

        window.addEventListener('resize', setSize);

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
        confirmButton.onclick = () => {
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
            rejectButton.onclick = () => {
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

        blocker.appendChild(container);
        document.body.appendChild(blocker);
        setSize();
    }
}
