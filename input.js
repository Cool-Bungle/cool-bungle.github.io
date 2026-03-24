function makeDraggable(el) {
  let isDragging = false, offsetX, offsetY;

  el.addEventListener("dragstart", e => e.preventDefault());

  el.addEventListener("mousedown", e => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    el.style.left = (e.clientX - offsetX) + "px";
    el.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });

  // mobile
  el.addEventListener("touchstart", e => {
    const t = e.touches[0];
    isDragging = true;
    offsetX = t.clientX - el.offsetLeft;
    offsetY = t.clientY - el.offsetTop;
  });

  el.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isDragging) return;
    const t = e.touches[0];
    el.style.left = (t.clientX - offsetX) + "px";
    el.style.top = (t.clientY - offsetY) + "px";
  });

  document.addEventListener("touchend", () => {
    isDragging = false;
  });
}

// apply to EVERYTHING with class "draggable"
document.querySelectorAll(".draggable").forEach(makeDraggable);
