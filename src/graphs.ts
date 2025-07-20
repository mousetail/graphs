type Graph = number[][];
type TreeNode = {
  parent: number | null;
  treeEdges: number[];
  backEdges: number[];
  depth: number;
};

function checkGraph(graph: number[][]) {
  graph.forEach((node, index) => {
    for (let edge of node) {
      if (!graph[edge].some((k) => k == index)) {
        throw new Error(
          `invalid graph, edge ${index}->${edge} exists, but ${edge}->${index} does not`
        );
      }
    }
  });
}

function edgeName(edge: [number, number]): string {
  return `${edge[0]},${edge[1]}`;
}

function cloneGraph(graph: Graph): Graph {
  return graph.map((i) => i.map((j) => j));
}

export function rotateGraph(graph: Graph, amount: number): Graph {
  const length = graph.length;
  return graph.map((_, j) =>
    graph[(j + length - amount) % length].map((j) => (j + amount) % length)
  );
}

function depthFirstSearch(g: Graph): Map<number, TreeNode> {
  g = cloneGraph(g);
  const out = new Map<number, TreeNode>();

  let currentNode = 0;
  const ancestors: number[] = [];
  let parent: number | null = null;
  let depth = 0;

  while (true) {
    const edges = g[currentNode];
    const treeEdges = edges.filter((i) => !out.has(i));
    const backEdges = edges.filter((i) => out.has(i) && i != parent);

    backEdges.forEach((k) => {
      const edgeRoot = out.get(k)!;
      edgeRoot.treeEdges = edgeRoot.treeEdges.filter((m) => m != currentNode);
    });

    if (!out.has(currentNode)) {
      out.set(currentNode, {
        parent,
        treeEdges,
        backEdges,
        depth,
      });
    }

    if (treeEdges.length == 0) {
      let ancestor = ancestors.pop();
      if (ancestor === undefined) {
        break;
      } else {
        parent = out.get(ancestor)?.parent ?? null;
        depth = out.get(ancestor)?.depth ?? 0;
        currentNode = ancestor;
      }
    } else {
      if (treeEdges.length > 1) {
        ancestors.push(currentNode);
      }

      g[currentNode] = g[currentNode].filter((j) => j != treeEdges[0]);

      parent = currentNode;
      currentNode = treeEdges[0];

      depth += 1;
    }
  }

  return out;
}

function computeLowPoints(
  graph: Map<number, TreeNode>
): Map<number, Map<number, number>> {
  const currentNode = 0;

  const out = new Map<number, Map<number, number>>();
  const getDepth = (v: number) => graph.get(v)!.depth;

  graph.forEach((value, key) => {
    const lowPoints = new Map();
    // If an edge is not part of a cycle, it's root is it's low point
    value.treeEdges.forEach((v) => {
      lowPoints.set(v, getDepth(key));
    });

    out.set(key, lowPoints);
  });

  function computeLowPointsRecursive(currentNode: number) {
    const backEdges = graph.get(currentNode)!.backEdges;

    backEdges.forEach((e) => {
      const v = out.get(currentNode)!;
      const depth = getDepth(e);

      v.set(e, depth);

      let ancestor = currentNode;
      // A back edge must always connect to an ancestor
      while (ancestor !== e) {
        const parent = graph.get(ancestor)!.parent!;
        out
          .get(parent)!
          .set(ancestor, Math.min(out.get(parent)!.get(ancestor)!, depth));
        ancestor = parent;
      }
    });

    graph
      .get(currentNode)!
      .treeEdges.forEach((i) => computeLowPointsRecursive(i));
  }

  computeLowPointsRecursive(currentNode);

  return out;
}

function groupBackEdges(
  graph: Map<number, TreeNode>,
  lowPoints: Map<number, Map<number, number>>
): Map<string, { same: Set<string>; opposite: Set<string> }> {
  const out = new Map<string, { same: Set<string>; opposite: Set<string> }>();
  graph.forEach((value, key) =>
    value.backEdges.forEach((edge) =>
      out.set(edgeName([key, edge]), {
        same: new Set(),
        opposite: new Set(),
      })
    )
  );

  const currentNode = 0;

  function* findAllBackEdges(node: number): Generator<[number, number]> {
    for (const v of graph.get(node)!.backEdges) {
      yield [node, v];
    }
    for (const m of graph.get(node)!.treeEdges) {
      yield* findAllBackEdges(m);
    }
  }

  function groupSets(set1: string[], set2: string[]) {
    set1.forEach((name1) => {
      set2.forEach((name2) => {
        out.get(name1)!.opposite.add(name2);
        out.get(name2)!.opposite.add(name1);
      });
    });

    [set1, set2].forEach((set) => {
      set.forEach((name1) => {
        set.forEach((name2) => {
          if (name1 === name2) {
            return;
          }

          out.get(name1)!.same.add(name2);
          out.get(name2)!.same.add(name1);
        });
      });
    });
  }

  function recurse(currentNode: number) {
    let g = graph.get(currentNode)!;

    while (g.treeEdges.length + g.backEdges.length == 1) {
      if (g.treeEdges.length == 1) {
        currentNode = g.treeEdges[0];
        g = graph.get(currentNode)!;
      } else {
        return;
      }
    }

    type Fork = { edges: [number, number][]; lowPoint: number };

    const forkPaths: Fork[] = [
      ...g.treeEdges.map(
        (i): Fork => ({
          lowPoint: lowPoints.get(currentNode)!.get(i)!,
          edges: [
            ...findAllBackEdges(i).filter(
              ([_a, b]) => graph.get(b)!.depth < g.depth
            ),
          ],
        })
      ),
      ...g.backEdges.map(
        (i): Fork => ({
          edges: [[currentNode, i]],
          lowPoint: graph.get(i)!.depth,
        })
      ),
    ].filter((i) => i.edges.length > 0);

    //console.log(currentNode, forkPaths);

    for (let i = 0; i < forkPaths.length; i++) {
      for (let j = i + 1; j < forkPaths.length; j++) {
        // this should include the 4, 1 edge (depth = 2)
        // Every route from 5 should be T-alike
        const set1 = forkPaths[i].edges
          .filter((t) => {
            const depth = graph.get(t[1])!.depth;
            return depth > forkPaths[j].lowPoint;
          })
          .map(edgeName);
        const set2 = forkPaths[j].edges
          .filter((t) => graph.get(t[1])!.depth > forkPaths[i].lowPoint)
          .map(edgeName);

        // if (set1.length != 0 || set2.length != 0) {
        //   console.log(
        //     currentNode,
        //     forkPaths[i],
        //     forkPaths[j],
        //     "set1",
        //     set1,
        //     "set2",
        //     set2
        //   );
        // }

        groupSets(set1, set2);
      }
    }

    for (const node of g.treeEdges) {
      recurse(node);
    }
  }

  recurse(currentNode);

  return out;
}

function toMermaid(
  graph: Map<number, TreeNode>,
  backEdges?: Map<number, Map<number, number>>
): string {
  let out = "";
  graph.forEach((value, key) => {
    out += `\t${key}["${key}\ndepth=${value.depth}"]\n`;

    value.treeEdges.forEach((edge) => {
      const label = backEdges?.get(key)?.get(edge);
      if (label !== undefined) {
        out += `\t${key} --"${label}"--> ${edge}\n`;
      } else {
        out += `\t${key} --> ${edge}\n`;
      }
    });

    value.backEdges.forEach((edge) => {
      const label = backEdges?.get(key)?.get(edge);
      if (label !== undefined) {
        out += `\t${key} -."${label}".-> ${edge}\n`;
      } else {
        out += `\t${key} -.-> ${edge}\n`;
      }
    });
  });

  return out;
}

function resolveBackEdges(
  edges: Map<string, { same: Set<string>; opposite: Set<string> }>
) {
  const leftEdges = new Set<string>();
  const rightEdges = new Set<string>();

  function recurse(edge: string, is_right: boolean) {
    const { same, opposite } = edges.get(edge)!;
    const [left, right] = is_right ? [opposite, same] : [same, opposite];

    left.forEach((edge2) => {
      if (!leftEdges.has(edge2)) {
        // console.log(
        //   `${edge} is ${is_right ? "right" : "left"} so ${edge2} is left`
        // );
        leftEdges.add(edge2);
        recurse(edge2, false);
      }
    });

    right.forEach((edge2) => {
      if (!rightEdges.has(edge2)) {
        // console.log(
        //   `${edge} is ${is_right ? "right" : "left"} so ${edge2} is right`
        // );
        rightEdges.add(edge2);
        recurse(edge2, true);
      }
    });
  }

  edges.forEach((value, key) => {
    if (leftEdges.has(key) || rightEdges.has(key)) {
      return;
    }

    recurse(key, false);
  });

  return [...edges.keys()].every(
    (i) => !leftEdges.has(i) || !rightEdges.has(i)
  );
}

export function isPlanar(graph: Graph) {
  checkGraph(graph);

  const dfs = depthFirstSearch(graph);
  const lowPoints = computeLowPoints(dfs);

  // console.log(toMermaid(dfs, lowPoints));

  const backEdges = groupBackEdges(dfs, lowPoints);
  // console.log(backEdges);

  return resolveBackEdges(backEdges);
}

const graph = [
  [1], // 0
  [0, 2, 4], // 1
  [1, 3, 5], // 2
  [2, 4, 7], // 3
  [1, 3, 5], // 4
  [4, 2, 6], // 5
  [5, 7], // 6
  [6, 3, 8], // 7
  [7], // 8
];

const graph2 = [
  [1, 2, 3, 4],
  [0, 2, 3, 4],
  [0, 1, 3, 4],
  [0, 1, 2, 4],
  [0, 1, 2, 3],
];

const graph3 = [
  [1],
  [0, 2, 3, 4, 5, 6, 7],
  [1, 8, 3, 7],
  [1, 8, 4, 2],
  [1, 8, 5, 3],
  [1, 8, 6, 4],
  [1, 8, 7, 5],
  [1, 8, 2, 6],
  [2, 3, 4, 5, 6, 7],
];

// console.log(is_planar(graph));
//console.log(isPlanar(graph2));
// console.log(is_planar(graph3));
