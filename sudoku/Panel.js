let infoContainer = null;
let frameResize = null;

if (!infoContainer) {
    const headerHeight = 24;
    const borderWidth = 3;
    const margin = 32;
    const windowMargin = 48;

    infoContainer = document.createElement('div');
    infoContainer.style.position = 'absolute';
    infoContainer.style.top = '50%';
    infoContainer.style.left = '50%';
    infoContainer.style.transform = 'translate(-50%, -50%)';
    infoContainer.style.display = 'none';
    infoContainer.style.background = 'hsl(0 100% 99%)';
    // infoContainer.style.backdropFilter = 'blur(3px)';

    const infoBacking = document.createElement('div');
    infoBacking.style.position = 'absolute';
    infoBacking.style.overflow = 'clip';
    infoBacking.style.width = '100%';
    infoBacking.style.height = '100%';
    infoBacking.style.left = -borderWidth + 'px';
    infoBacking.style.top = -borderWidth + 'px';
    infoBacking.style.border = borderWidth + 'px solid black';
    infoBacking.style.borderRadius = '8px';
    // infoBacking.style.boxShadow = '0px 0px 3px black';

    const frame = document.createElement('iframe');
    frame.style.top = headerHeight + 'px';
    frame.style.borderTop = '1px solid rgba(0,0,0,0.5)';
    frame.style.borderBottom = 'none';
    frame.style.borderLeft = 'none';
    frame.style.borderRight = 'none';
    frame.style.position = 'absolute';
    frame.style.overflow = 'visible';
    frame.style.background = 'white';

    const setWidth = () => {
        const max = window.innerWidth - windowMargin;
        let fixedWidth = Math.min(max, 640);
        infoContainer.style.width = fixedWidth + 'px';
        frame.style.width = fixedWidth + 'px';
    };
    setWidth();

    let loaded = false;
    frameResize = () => {
        if (!infoContainer.parentElement) return;
        if (!loaded) return;

        setWidth();

        const body = frame.contentWindow.document.body;
        const html = body.parentElement;
        const scroll = html.scrollTop;

        const max = window.innerHeight - windowMargin - headerHeight;
        frame.style.height = frame.contentWindow.document.body.scrollHeight + margin * 2 + 'px';

        let height = frame.contentWindow.document.body.scrollHeight + margin * 2;

        if (height > max) height = max;

        infoContainer.style.height = height + headerHeight + 'px';
        frame.style.height = height + 'px';

        html.scrollTop = scroll;
    };
    frame.onload = () => {
        loaded = true;
        infoContainer.style.display = 'block';
        frame.contentWindow.document.body.style.margin = margin + 'px';
        frameResize();
    };
    window.addEventListener('resize', frameResize);
    frame.src = "./info.html";

    const closeButton = document.createElement('img');
    closeButton.src = "./icons/close_small_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
    const size = headerHeight;
    const padding = 16;
    closeButton.width = size;
    closeButton.height = size;
    closeButton.style.width = size + 'px';
    closeButton.style.height = size + 'px';
    closeButton.style.position = 'absolute';
    closeButton.style.paddingTop = padding + 'px';
    closeButton.style.paddingLeft = padding + 'px';
    closeButton.style.paddingRight = padding + 'px';
    closeButton.style.paddingBottom = '0px';

    closeButton.style.top = -padding + 'px';
    closeButton.style.right = -padding + 'px';

    closeButton.addEventListener('click', () => {
        if (infoContainer.parentElement) {
            infoContainer.parentElement.removeChild(infoContainer);
        }
    });

    infoBacking.appendChild(frame);
    infoContainer.appendChild(infoBacking);
    infoContainer.appendChild(closeButton);
}

if (!infoContainer.parentElement) {
    document.body.appendChild(infoContainer);
    if (frameResize) frameResize();
}

export class Panel {
    static alert(message) {
        alert(message);
    }
    static confirm(message) {
        return window.confirm(message);
    }
    constructor() {

    }
}
