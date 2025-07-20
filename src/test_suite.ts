import { isPlanar, rotateGraph } from "./graphs.ts";

function parse_dmacs(t: string): number[][] {
  const lines = t
    .split("\n")
    .map((i) => i.trim())
    .filter((i) => (i != "" && i[0] == "e") || i[0] == "p");

  const [numVerticies, _numEdges] = lines[0]
    .split(/ /g)
    .slice(2)
    .map((i) => Number.parseInt(i));

  let out: number[][] = Array.from({ length: numVerticies })
    .fill(0)
    .map((_) => []);

  lines.slice(1).forEach((k) => {
    const [m, source, dest] = k.split(/ /g).map((i) => Number.parseInt(i));

    out[source].push(dest);
    out[dest].push(source);
  });

  while (out[0].length == 0) {
    out = rotateGraph(out, -1);
    out.pop();
  }

  return out;
}

async function runTestSuite() {
  let [correct, incorrect] = [0, 0];

  let lowest_number_of_nodes = Infinity;
  let smallest_graph = null;

  for await (let file of Deno.readDir(
    "../boost_graph/test/planar_input_graphs"
  )) {
    if (!file.name.endsWith(".dimacs")) {
      continue;
    }

    const text = await Deno.readTextFile(
      "../boost_graph/test/planar_input_graphs/" + file.name
    );

    const graph = parse_dmacs(text);
    const is_graph_planar = isPlanar(graph);
    const graph_should_be_planar = !file.name.startsWith("nonplanar");

    if (is_graph_planar != graph_should_be_planar) {
      incorrect += 1;
      console.log(
        is_graph_planar,
        file.name,
        ((correct * 100) / (correct + incorrect)).toFixed(2) + "% correct"
      );

      if (graph.length < lowest_number_of_nodes) {
        lowest_number_of_nodes = graph.length;
        smallest_graph = file.name;
      }
    }
    {
      correct += 1;
    }
  }

  console.log("Smallest incorrect graph was", smallest_graph);
}

async function runSingleTest(filename: string) {
  const text = await Deno.readTextFile(
    "../boost_graph/test/planar_input_graphs/" + filename
  );

  const graph = parse_dmacs(text);
  const is_planar = isPlanar(graph);
  console.log(graph);
  console.log(is_planar);
}

await runTestSuite();
//await runSingleTest("nonplanar_K_5_e_6_p5.dimacs");
