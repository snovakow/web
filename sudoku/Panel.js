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
blocker.onclick = (event) => {
    if (event.target === blocker) closeBlocker();
}

export class Panel {
    static alert(message) {
        const panel = new Panel();
        panel.show(message);
    }
    static confirm(message) {
        return window.confirm(message);
    }
    constructor(responder) {
    }
    show(message) {
        const headerHeight = 24;
        const borderWidth = 3;
        const margin = 32;
        const windowMargin = 48;

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.background = 'hsl(0 100% 99%)';
        container.style.border = borderWidth + 'px solid black';
        container.style.borderRadius = '8px';
        container.style.overflow = 'clip';

        container.style.height = '100px';

        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = headerHeight + 'px';
        content.style.borderTop = '1px solid rgba(0,0,0,0.5)';
        content.style.borderBottom = 'none';
        content.style.borderLeft = 'none';
        content.style.borderRight = 'none';
        // content.style.height = 100 - headerHeight + 'px';
        content.style.overflow = 'auto';

        content.style.color = 'black';
        content.style.background = 'white';

        content.appendChild(document.createTextNode(message));
        for (let i = 0; i < 100; i++) content.appendChild(document.createTextNode(message));

        const setWidth = () => {
            const max = window.innerWidth - windowMargin;
            let fixedWidth = Math.min(max, 640);
            container.style.width = fixedWidth + 'px';
            content.style.width = fixedWidth + 'px';
        };
        const setHeight = () => {
            const fullHeight = content.scrollHeight + headerHeight;
            const max = window.innerWidth - windowMargin;
            let fixedHeight = Math.min(fullHeight, max);
            container.style.height = fixedHeight + 'px';
            // content.style.width = fixedHeight + 'px';
        };
        const resize = () => {
            console.log(content.scrollHeight);
        };
        window.addEventListener('resize', resize);

        setWidth();

        const closeButton = document.createElement('img');
        closeButton.src = "./icons/close_small_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
        const size = headerHeight;
        const padding = 16;
        closeButton.style.position = 'absolute';
        closeButton.style.width = size + 'px';
        closeButton.style.height = size + 'px';
        closeButton.style.paddingTop = padding + 'px';
        closeButton.style.paddingLeft = padding + 'px';
        closeButton.style.paddingRight = padding + 'px';
        closeButton.style.paddingBottom = '0px';

        closeButton.style.top = -padding + 'px';
        closeButton.style.right = -padding + 'px';

        closeButton.onclick = () => {
            closeBlocker();
        };

        container.appendChild(content);
        container.appendChild(closeButton);
        // if (!infoContainer.parentElement) {
        //     document.body.appendChild(infoContainer);
        //     if (frameResize) frameResize();
        // }


        blocker.appendChild(container);
        document.body.appendChild(blocker);
        setHeight();
    }
}
