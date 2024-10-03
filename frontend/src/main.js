import { Scrape, Open } from "../wailsjs/go/main/App";
import ForceGraph3D from "3d-force-graph";

const createGraph = async () => {
  const data = await Scrape();

  const nodesSet = new Set();
  const links = [];

  for (const source in data) {
    if (!URL.canParse(source)) continue;

    nodesSet.add(source);
    const targets = data[source];

    for (const target in targets) {
      if (!URL.canParse(target)) continue;

      nodesSet.add(target);
      links.push({ source, target });
    }
  }

  const nodes = Array.from(nodesSet).map((id) => {
    const url = new URL(id);
    return { id, group: url.hostname };
  });

  const graph = ForceGraph3D()(document.querySelector("#container"))
    .graphData({ nodes, links })
    .nodeLabel((n) => n.id)
    .nodeAutoColorBy("group")
    .onNodeClick((node) => {
      Open(node.id);
    });
};

createGraph();
