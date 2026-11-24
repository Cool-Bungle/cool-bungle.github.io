const canvas = document.getElementById('webgl-bg');
const stage = document.querySelector('.stage');
const gl = canvas.getContext('webgl2', { alpha: true }) || canvas.getContext('webgl', { alpha: true });

function syncCanvasSize() {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // Mobile performance

  const displayWidth = Math.round(rect.width * dpr);
  const displayHeight = Math.round(rect.height * dpr);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = canvas.width / canvas.height;
  }
}

const observer = new ResizeObserver(syncCanvasSize);
observer.observe(stage);

function render(time){
  gl.clearColor(0, 0, 0, 0.1);
  gl.clear(gl.COLOR_BUFFER_BIT);


  requestAnimationFrame(render);
}

requestAnimationFrame(render);
