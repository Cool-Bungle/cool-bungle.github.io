(() => {
  "use strict";

  const canvas = document.getElementById("glCanvas");
  const status = document.getElementById("status");

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    status.textContent = "WebGL is not supported in this browser.";
    console.error("WebGL is not supported.");
    return;
  }

  // Aspect ratios/Resolutions.
  function getTargetBufferResolution() {
    const ratio = window.innerWidth / Math.max(1, window.innerHeight);

    if (ratio > 1.01) return { width: 236, height: 169 };
    if (ratio < 0.99) return { width: 179, height: 224 };
    return { width: 200, height: 200 };
  }

  let resolution = getTargetBufferResolution();
  let startTime = performance.now();
  let sourceTexture;
  let lowResTexture;
  let framebuffer;
  let captureBusy = false;
  let lastCaptureAt = 0;
  let captureCanvas = null;

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;

    void main() {
      v_texCoord = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // source image -> low-resolution framebuffer.
  const processFragmentSource = `
    precision mediump float;

    uniform sampler2D u_source;
    uniform vec2 u_resolution;
    uniform float u_time;

    varying vec2 v_texCoord;

    vec3 rgb2ycbcr(vec3 rgb) {
      float y = 0.2990 * rgb.r + 0.5870 * rgb.g + 0.1140 * rgb.b;
      float cb = -0.1687 * rgb.r - 0.3313 * rgb.g + 0.5000 * rgb.b + 0.5;
      float cr = 0.5000 * rgb.r - 0.4187 * rgb.g - 0.0813 * rgb.b + 0.5;
      return vec3(y, cb, cr);
    }

    vec3 ycbcr2rgb(vec3 ycc) {
      float y = ycc.r;
      float cb = ycc.g - 0.5;
      float cr = ycc.b - 0.5;

      return vec3(
        y + 1.40200 * cr,
        y - 0.34414 * cb - 0.71414 * cr,
        y + 1.77200 * cb
      );
    }

    float randomNoise(vec2 p) {
      return fract(sin(dot(p + vec2(u_time * 0.07, u_time * 0.11),
                            vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 texel = 1.0 / u_resolution;
      vec3 sourceRgb = texture2D(u_source, v_texCoord).rgb;
      vec3 centerYcc = rgb2ycbcr(sourceRgb);

      // Four-neighbor luminance blur for an unsharp-mask-like effect.
      vec3 leftYcc = rgb2ycbcr(texture2D(u_source, v_texCoord - vec2(texel.x, 0.0)).rgb);
      vec3 rightYcc = rgb2ycbcr(texture2D(u_source, v_texCoord + vec2(texel.x, 0.0)).rgb);
      vec3 downYcc = rgb2ycbcr(texture2D(u_source, v_texCoord - vec2(0.0, texel.y)).rgb);
      vec3 upYcc = rgb2ycbcr(texture2D(u_source, v_texCoord + vec2(0.0, texel.y)).rgb);

      float yBlur = (leftYcc.r + rightYcc.r + downYcc.r + upYcc.r) * 0.25;
      float sharpenedY = clamp(centerYcc.r + (centerYcc.r - yBlur) * 0.5, 0.0, 1.0);

      // Average chroma from a small neighborhood. Luma remains from the center.
      vec3 c1 = rgb2ycbcr(texture2D(u_source, v_texCoord + texel * vec2(1.5, 1.5)).rgb);
      vec3 c2 = rgb2ycbcr(texture2D(u_source, v_texCoord + texel * vec2(-1.5, 1.5)).rgb);
      vec3 c3 = rgb2ycbcr(texture2D(u_source, v_texCoord + texel * vec2(1.5, -1.5)).rgb);
      vec3 c4 = rgb2ycbcr(texture2D(u_source, v_texCoord - texel * vec2(1.5, 1.5)).rgb);

      vec2 chroma = (c1.yz + c2.yz + c3.yz + c4.yz) * 0.25;
      vec3 finalRgb = ycbcr2rgb(vec3(sharpenedY, chroma));
      float noise = (randomNoise(gl_FragCoord.xy) - 0.5) * 0.08;

      finalRgb = clamp(finalRgb + vec3(noise), 0.0, 1.0);
      gl_FragColor = vec4(finalRgb, texture2D(u_source, v_texCoord).a);
    }
  `;

  // scale the processed low-resolution texture to the device canvas.
  const upscaleFragmentSource = `
    precision mediump float;
    uniform sampler2D u_processed;
    varying vec2 v_texCoord;

    void main() {
      gl_FragColor = texture2D(u_processed, v_texCoord);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(fragmentSource) {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "Unknown program link error";
      gl.deleteProgram(program);
      throw new Error(message);
    }

    return program;
  }

  let processProgram;
  let upscaleProgram;
  let quadBuffer;

  try {
    processProgram = createProgram(processFragmentSource);
    upscaleProgram = createProgram(upscaleFragmentSource);
  } catch (error) {
    status.textContent = "Shader error — see console.";
    console.error(error);
    return;
  }

  // Full-screen two-triangle quad, shared by both passes.
  quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  function bindQuad(program) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    const location = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  function makeTexture(filter) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  // Source uses linear filtering while it is reduced into the low-res buffer.
  sourceTexture = makeTexture(gl.LINEAR);
  // Nearest filtering keeps the final enlarged pixels crisp.
  lowResTexture = makeTexture(gl.NEAREST);
  framebuffer = gl.createFramebuffer();

  function resizeLowResolutionTarget() {
    resolution = getTargetBufferResolution();

    gl.bindTexture(gl.TEXTURE_2D, lowResTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      resolution.width, resolution.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, lowResTexture, 0
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Low-resolution framebuffer is incomplete.");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function resizeDisplayCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  try {
    resizeLowResolutionTarget();
  } catch (error) {
    status.textContent = "Framebuffer error — see console.";
    console.error(error);
    return;
  }

  // Capture the visible page. The canvas overlay is hidden during capture to
  // avoid capturing the previous processed frame recursively.
  async function capturePage(now) {
    if (!window.html2canvas || captureBusy || now - lastCaptureAt < 500) return;

    captureBusy = true;
    lastCaptureAt = now;
    const oldVisibility = canvas.style.visibility;
    canvas.style.visibility = "hidden";

    try {
      const page = document.documentElement;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      captureCanvas = await window.html2canvas(page, {
        x: scrollX,
        y: scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: Math.max(page.scrollWidth, window.innerWidth),
        windowHeight: Math.max(page.scrollHeight, window.innerHeight),
        scrollX: -scrollX,
        scrollY: -scrollY,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });

      gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, captureCanvas
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      status.textContent = `${resolution.width} × ${resolution.height} internal`;
    } catch (error) {
      console.error("Page capture failed:", error);
      status.textContent = "Page capture failed — see console.";
    } finally {
      canvas.style.visibility = oldVisibility;
      captureBusy = false;
    }
  }

  function render(now) {
    resizeDisplayCanvas();

    // If no capture has been uploaded yet, keep the page visible underneath.
    if (captureCanvas) {
      // PASS 1: process the source image at the selected low resolution.
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, resolution.width, resolution.height);
      gl.useProgram(processProgram);
      bindQuad(processProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      gl.uniform1i(gl.getUniformLocation(processProgram, "u_source"), 0);
      gl.uniform2f(
        gl.getUniformLocation(processProgram, "u_resolution"),
        resolution.width, resolution.height
      );
      gl.uniform1f(
        gl.getUniformLocation(processProgram, "u_time"),
        (now - startTime) * 0.001
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // PASS 2: upscale the processed texture to the actual display canvas.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(upscaleProgram);
      bindQuad(upscaleProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, lowResTexture);
      gl.uniform1i(gl.getUniformLocation(upscaleProgram, "u_processed"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    requestAnimationFrame(render);
    capturePage(now);
  }

  window.addEventListener("resize", () => {
    try {
      resizeLowResolutionTarget();
    } catch (error) {
      console.error(error);
      status.textContent = "Framebuffer resize failed.";
    }
  });

  // Re-capture after scrolling, since the visible viewport has changed.
  let scrollCaptureRequested = false;
  window.addEventListener("scroll", () => {
    if (scrollCaptureRequested) return;
    scrollCaptureRequested = true;
    requestAnimationFrame(() => {
      lastCaptureAt = 0;
      scrollCaptureRequested = false;
    });
  }, { passive: true });

  // Update after common UI interactions; periodic capture also catches changes.
  document.addEventListener("click", () => { lastCaptureAt = 0; }, true);
  document.addEventListener("input", () => { lastCaptureAt = 0; }, true);

  requestAnimationFrame(render);
})();
