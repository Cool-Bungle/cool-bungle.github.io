const img = document.getElementById("draggable");

img.addEventListener("dragstart", (e) => e.preventDefault());

let isDragging = false;
let offsetX, offsetY;

img.addEventListener("mousedown", (e) => {
  isDragging = true;

  offsetX = e.clientX - img.offsetLeft;
  offsetY = e.clientY - img.offsetTop;

  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  img.style.left = (e.clientX - offsetX) + "px";
  img.style.top = (e.clientY - offsetY) + "px";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.userSelect = "auto";
});

img.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  startDrag(touch.clienX, touch.clientY);
})

img.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  moveDrag(touch.clienX, touch.clientY);
})

document.addEventListener("touchend", endDrag);
