import { Graph } from "graphology";
import Sigma from "sigma";
import { Scrape, Open } from "../wailsjs/go/main/App";
import { circular } from "graphology-layout";

// Create a new graph
const graph = new Graph();

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

try {
  Scrape().then((res) => {
    let filtered = Object.entries(res).filter(
      (key) => key[0].length > 0 && isValidUrl(key[0]),
    );
    filtered.forEach((key, value) => {
      graph.addNode(key[0], {
        label: key[0],
        size: 5,
        x: Math.random(),
        y: Math.random(),
      });
    });
    filtered.forEach((key, value) => {
      Object.entries(key[1]).forEach((a, b) => {
        console.log(a[0]);
        try {
          graph.addEdge(key[0], a[0]);
        } catch (err) {
          console.log(err);
        }
      });
    });
    createOrUpdateRenderer();
  });
} catch (err) {
  console.log(err);
}

// Apply a circular layout
circular.assign(graph);

// Initialize Sigma
const container = document.getElementById("sigma-container");
let renderer;

// Function to create or update the renderer
function createOrUpdateRenderer() {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  // Ensure the container is visible and has dimensions
  if (!width || !height) {
    console.error("Container dimensions are invalid.");
    return;
  }

  if (renderer) {
    renderer.kill(); // Remove previous renderer
  }

  renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
    allowInvalidContainer: true,
    minCameraRatio: 0.1,
    maxCameraRatio: 10,
    width: width,
    height: height,
    defaultNodeColor: "#ff0000",
    defaultEdgeColor: "#999999",
    labelColor: {
      color: "#ffffff",
    },
  });

  renderer.on("clickNode", (event) => {
    Open(event.node);
  });

  // Center the camera
  const camera = renderer.getCamera();
  camera.animatedReset();

  // Set up zoom controls
  setupZoomControls(renderer);

  // Refresh the graph to ensure it's rendered correctly
  renderer.refresh();
}

// Function to handle resizing
function handleResize() {
  createOrUpdateRenderer();
}

// Function to set up zoom controls
function setupZoomControls(sigmaInstance) {
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");

  zoomInBtn.addEventListener("click", () => {
    const camera = sigmaInstance.getCamera();
    camera.animatedZoom({ duration: 600 });
  });

  zoomOutBtn.addEventListener("click", () => {
    const camera = sigmaInstance.getCamera();
    camera.animatedUnzoom({ duration: 600 });
  });

  zoomResetBtn.addEventListener("click", () => {
    const camera = sigmaInstance.getCamera();
    camera.animatedReset({ duration: 600 });
  });

  console.log("Zoom controls set up");
}

// Function to ensure the graph renders only when the DOM is ready
function onDomReady() {
  if (container.offsetWidth && container.offsetHeight) {
    createOrUpdateRenderer(); // Only create when dimensions are valid
  } else {
    console.log("Waiting for container dimensions...");
  }
}

// Add event listener for window resize
window.addEventListener("resize", handleResize);

// Add event listener for window focus
window.addEventListener("focus", () => {
  if (renderer) {
    renderer.refresh();
  }
});

// Ensure the graph is rendered after the DOM loads
window.addEventListener("load", () => {
  onDomReady();
  setupZoomControls(renderer);
});

// Expose a function to manually trigger refresh (useful for Go-Wails integration)
window.refreshGraph = function () {
  if (renderer) {
    renderer.refresh();
    console.log("Graph refreshed");
  }
};
