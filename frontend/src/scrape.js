import { Graph } from "graphology";
import Sigma from "sigma";
import { Scrape, Pipe, Open } from "../wailsjs/go/main/App";

const graph = new Graph();
const container = document.getElementById("sigma-container");
let renderer;
let cameraZoomRatio = 1; // Store the camera's zoom ratio
const width = container.offsetWidth;
const height = container.offsetHeight;

window.runtime.EventsOn("update", Update);

function Update(data) {
  if (data.length == 0) {
    return;
  }
  console.log("update");
  for (const obj of data) {
    if (!URL.canParse(obj.From) || !URL.canParse(obj.To)) continue;
    if (!graph.hasNode(obj.From)) {
      graph.addNode(obj.From, {
        label: obj.From,
        size: 5,
        x: undefined,
        y: undefined,
      });
    }
    if (!graph.hasNode(obj.To)) {
      graph.addNode(obj.To, {
        label: obj.To,
        size: 5,
        x: undefined,
        y: undefined,
      });
    }
    if (!graph.hasEdge(obj.From, obj.To)) {
      graph.addEdge(obj.From, obj.To, {
        weight: 1,
      });
    } else {
      graph.updateEdge(obj.From, obj.To, (attr) => {
        return {
          ...attr,
          weight: (attr.weight || 1) + 1,
        };
      });
    }
  }

  updateNodeSizes();
  updateLayout();
  if (renderer) {
    // Persist zoom level before refreshing
    cameraZoomRatio = renderer.getCamera().getState().ratio;
    renderer.refresh();
    adjustCameraZoom();
  }
}

function updateNodeSizes() {
  const minSize = 5;
  const maxSize = 20;
  const maxEdges = Math.max(...graph.nodes().map((node) => graph.degree(node)));

  graph.forEachNode((node, attributes) => {
    const edgeCount = graph.degree(node);
    const size = minSize + (maxSize - minSize) * (edgeCount / maxEdges);
    const color = getColorForSize(size, minSize, maxSize);
    graph.setNodeAttribute(node, "size", size);
    graph.setNodeAttribute(node, "color", color);
  });
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const rgb = [f(0), f(8), f(4)].map((x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${rgb.join("")}`;
}

function getColorForSize(size, minSize, maxSize) {
  const t = (size - minSize) / (maxSize - minSize);
  const hue = t * 240; // 0 (red) to 240 (blue)
  return hslToHex(hue, 100, 50);
}

function updateLayout() {
  const nodeCount = graph.order;
  const radius = Math.sqrt(nodeCount) * 75; // Adjust this multiplier as needed

  graph.forEachNode((node, attributes) => {
    // Check if the node already has x and y positions
    if (attributes.x !== undefined && attributes.y !== undefined) {
      return; // Skip updating the position of existing nodes
    }

    // Calculate a new random position for new nodes
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * radius;
    attributes.x = r * Math.cos(angle);
    attributes.y = r * Math.sin(angle);
  });
}

function adjustCameraZoom() {
  const nodeCount = graph.order;
  const camera = renderer.getCamera();
  // Apply the stored zoom ratio
  camera.setState({ ratio: cameraZoomRatio });
}

function createOrUpdateRenderer() {
  if (!width || !height) {
    console.error("Container dimensions are invalid.");
    return;
  }
  if (renderer) {
    renderer.kill();
  }
  renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
    allowInvalidContainer: true,
    minCameraRatio: 0.01,
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

  adjustCameraZoom();
  setupZoomControls(renderer);
  renderer.refresh();
}

function handleResize() {
  createOrUpdateRenderer();
}

function setupZoomControls(sigmaInstance) {
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");

  zoomInBtn.addEventListener("click", () => {
    const camera = sigmaInstance.getCamera();
    camera.animatedZoom({ duration: 600 });
    // Store zoom ratio after zooming
    cameraZoomRatio = camera.getState().ratio;
  });

  zoomOutBtn.addEventListener("click", () => {
    const camera = sigmaInstance.getCamera();
    camera.animatedUnzoom({ duration: 600 });
    // Store zoom ratio after unzooming
    cameraZoomRatio = camera.getState().ratio;
  });

  zoomResetBtn.addEventListener("click", () => {
    adjustCameraZoom();
  });
}

function onDomReady() {
  if (container.offsetWidth && container.offsetHeight) {
    createOrUpdateRenderer();
  } else {
    console.log("Waiting for container dimensions...");
  }
}

window.addEventListener("resize", handleResize);
window.addEventListener("focus", () => {
  if (renderer) {
    renderer.refresh();
  }
});

window.addEventListener("load", () => {
  onDomReady();
  Pipe();
  Scrape();
  setupZoomControls(renderer);
});

window.refreshGraph = function () {
  if (renderer) {
    // Store zoom ratio before refreshing
    cameraZoomRatio = renderer.getCamera().getState().ratio;
    renderer.refresh();
    // Reapply the stored zoom ratio after refreshing
    adjustCameraZoom();
    console.log("Graph refreshed");
  }
};
