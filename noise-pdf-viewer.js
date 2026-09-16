import * as pdfjsLib from "./priya-assets/vendor/pdfjs/pdf.min.mjs";

const PDF_URL = "./priya-assets/noise/works-from-noise.pdf?v=20260914-noise-pdf";
const WORKER_URL = new URL("./priya-assets/vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
const pagesRoot = document.querySelector("#pdf-pages");
const loading = document.querySelector("#pdf-loading");
const error = document.querySelector("#pdf-error");
const status = document.querySelector("#pdf-status");
const rendered = new Set();
const rendering = new Map();
let pdfDocument;

pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

function createPageFrame(pageNumber, totalPages) {
  const frame = document.createElement("section");
  frame.className = "pdf-viewer-sheet";
  frame.dataset.page = String(pageNumber);
  frame.setAttribute("aria-label", `Portfolio slide ${pageNumber} of ${totalPages}`);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "pdf-viewer-sheet__canvas-wrap";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvasWrap.append(canvas);

  const label = document.createElement("p");
  label.className = "pdf-viewer-sheet__label";
  label.innerHTML = "<span>Complete Noise archive</span>";

  frame.append(canvasWrap, label);
  return frame;
}

async function renderPage(frame) {
  const pageNumber = Number(frame.dataset.page);
  if (rendered.has(pageNumber)) return;
  if (rendering.has(pageNumber)) return rendering.get(pageNumber);

  const task = (async () => {
    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const canvasWrap = frame.querySelector(".pdf-viewer-sheet__canvas-wrap");
    canvasWrap.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;
    const cssWidth = Math.max(280, frame.clientWidth);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderWidth = Math.min(cssWidth * pixelRatio, 1800);
    const viewport = page.getViewport({ scale: renderWidth / baseViewport.width });
    const canvas = frame.querySelector("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;
    await page.render({ canvasContext: context, viewport }).promise;
    rendered.add(pageNumber);
    frame.classList.add("is-rendered");
  })().finally(() => rendering.delete(pageNumber));

  rendering.set(pageNumber, task);
  return task;
}

async function startViewer() {
  try {
    pdfDocument = await pdfjsLib.getDocument(PDF_URL).promise;
    const fragment = document.createDocumentFragment();
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      fragment.append(createPageFrame(pageNumber, pdfDocument.numPages));
    }
    pagesRoot.append(fragment);
    status.textContent = `${pdfDocument.numPages} slides`;

    const frames = [...pagesRoot.querySelectorAll(".pdf-viewer-sheet")];
    await renderPage(frames[0]);
    loading.hidden = true;

    const renderObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) renderPage(entry.target);
      });
    }, { rootMargin: "1200px 0px" });

    frames.forEach(frame => renderObserver.observe(frame));
  } catch (viewerError) {
    console.error(viewerError);
    loading.hidden = true;
    error.hidden = false;
    status.textContent = "Unavailable";
  }
}

startViewer();
