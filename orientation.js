if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function () {
        tilt([event.beta, event.gamma]);
    }, true);
} else if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function () {
        tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
    }, true);
} else {
    window.addEventListener("MozOrientation", function () {
        tilt([orientation.x * 50, orientation.y * 50]);
    }, true);
}

function HorizonLock(el) {
    window.addEventListener("deviceorientation", (event) => {
        if (event.alpha == null || event.beta == null || event.gamma == null) return;

        // Screen orientation
        const screenAngle = screen.orientation?.angle ?? 0;

        // Compensate
        const rotation = -event.alpha; // Compass Heading

        el.style.transform = `rotate(${rotation}deg)`;
    }, true);
}

document.querySelectorAll(".lock").forEach(HorizonLock);
