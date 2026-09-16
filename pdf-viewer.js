import * as pdfjsLib from "./priya-assets/vendor/pdfjs/pdf.min.mjs";

const PDF_URL = "./priya-assets/bombay/works-from-bombay-shaving-company.pdf?v=20260914-packaging";
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
  frame.setAttribute("aria-label", `Portfolio page ${pageNumber} of ${totalPages}`);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "pdf-viewer-sheet__canvas-wrap";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvasWrap.append(canvas);

  const label = document.createElement("p");
  label.className = "pdf-viewer-sheet__label";
  label.innerHTML = `<span>Packaging archive</span><span>${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}</span>`;

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
    const cssWidth = Math.max(280, frame.clientWidth);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderWidth = Math.min(cssWidth * pixelRatio, 1800);
    const viewport = page.getViewport({ scale: renderWidth / baseViewport.width });
    const canvas = frame.querySelector("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
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
    status.textContent = `1 / ${pdfDocument.numPages}`;

    const frames = [...pagesRoot.querySelectorAll(".pdf-viewer-sheet")];
    await renderPage(frames[0]);
    loading.hidden = true;

    const renderObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) renderPage(entry.target);
      });
    }, { rootMargin: "1200px 0px" });

    const pageObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) status.textContent = `${visible.target.dataset.page} / ${pdfDocument.numPages}`;
    }, { threshold: [.35, .55, .75] });

    frames.forEach(frame => {
      renderObserver.observe(frame);
      pageObserver.observe(frame);
    });
  } catch (viewerError) {
    console.error(viewerError);
    loading.hidden = true;
    error.hidden = false;
    status.textContent = "Unavailable";
  }
}

startViewer();
