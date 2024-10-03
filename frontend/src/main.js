import { Scrape, Open } from "../wailsjs/go/main/App";
import ForceGraph3D from "3d-force-graph";

const createGraph = async () => {
  const data = await Scrape();

  const nodesSet = new Set();
  const linksMap = new Map();
  for (const source in data) {
    if (!URL.canParse(source)) continue;

    nodesSet.add(source);
    const targets = data[source];

    for (const target in targets) {
      if (!URL.canParse(target)) continue;
      nodesSet.add(target);
      const weight = targets[target] || 1;
      const linkKey = `${source}->${target}`;
      if (linksMap.has(linkKey)) {
        linksMap.get(linkKey).value += weight;
      } else {
        linksMap.set(linkKey, { source, target, value: weight });
      }
    }
  }

  const nodes = Array.from(nodesSet).map((id) => {
    const url = new URL(id);
    return { id, group: url.hostname };
  });
  const links = Array.from(linksMap.values());

  const graph = ForceGraph3D()(document.getElementById("container"))
    .graphData({ nodes, links })
    .nodeLabel((link) => link.id)
    .nodeAutoColorBy("group")
    .linkWidth((link) => Math.sqrt(link.value) / 4)
    .onNodeClick((node) => Open(node.id));

  const center = { x: 0, y: 0, z: 0 };
  const initialCameraPosition = { ...graph.cameraPosition() };
  const zoomFactor = 0.8;
  document.getElementById("zoom-in").addEventListener("click", () => {
    const distance = graph.cameraPosition().z * zoomFactor;
    graph.cameraPosition({ z: distance }, center, 500);
  });
  document.getElementById("zoom-out").addEventListener("click", () => {
    const distance = graph.cameraPosition().z / zoomFactor;
    graph.cameraPosition({ z: distance }, center, 500);
  });
  document.getElementById("zoom-reset").addEventListener("click", () => {
    graph.cameraPosition(initialCameraPosition, center, 500);
  });
};

createGraph();
