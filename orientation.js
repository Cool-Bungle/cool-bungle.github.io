const lockedElements = [...document.querySelectorAll(".lock")];

function HorizonLock(el) {
    const rect = el.getBoundingClientRect();

    // Save the element's original center relative to screen center.
    const x = rect.left + rect.width / 2 - innerWidth / 2;
    const y = rect.top + rect.height / 2 - innerHeight / 2;

    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.margin = "0";
    el.style.transformOrigin = "center center";

    function update() {
        const angle = -currentAngle * Math.PI / 180;
        const rx = x * Math.cos(angle) - y * Math.sin(angle);
        const ry = x * Math.sin(angle) + y * Math.cos(angle);

        el.style.transform =
            `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) rotate(${-currentAngle}deg)`;
    }

    update();
    return update;
}

let currentAngle = 0;
const updateLocks = lockedElements.map(HorizonLock);

window.addEventListener("deviceorientation", (event) => {
    // gamma is the sideways tilt in portrait orientation.
    if (event.gamma == null) return;

    currentAngle = event.gamma;
    updateLocks.forEach(update => update());
}, true);
