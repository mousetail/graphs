# Planar Graph Algorithms

This project is my attempt at implementing the LR Graph Planarity algorithm. It's meant to be included in a challenge in [Byte Heist](https://byte-heist.com).

Test cases taken from the [Boost Graph Library](https://github.com/boostorg/graph/tree/develop),
licenced under the boost licence.

## Explanation of the Left-Right Graph Planarity Algorithm

I could not find a reasonable explanation online so here it is. Most of this is taken from [this excellent explanation by Ulrik Brandes](https://www.cs.ubc.ca/~will/536E/papers/LRPlanarityBrandes.pdf). However, I've greatly shortened and simplified it so it's more understandable to non-mathamaticaians, as well as left out proofs and the contruction of a planar embedding.

### Definitions

A _Graph_ is a set of nodes and a multiset of pairs of nodes. A graph can be _directed_, meaing the edges have a given direction on _undirected_ if not.

A graph is _planar_ if it's possible to draw onto a flat plane without any edges intersecting.

Every non-planar graph mut be able to be reduced to either K(5) or K(3,3):

**K(5)**:
![K(5)](https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Complete_graph_K5.svg/120px-Complete_graph_K5.svg.png)
**K(3,3)**
![K(3,3)](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Biclique_K_3_3.svg/100px-Biclique_K_3_3.svg.png)

A _Tree_ is a graph such that there is exactly one route between any two nodes, i.e. the graph has no cycles. A _Directed Acyclic Graph_ is a special type of tree that has a root node and all nodes have a _depth_ indicating distance to the root node. In A DAG, each node has a _parent_ towards the root and 0 or more children away from the root.

**An example of a Tree:** ![Tree](https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Tree_graph.svg/180px-Tree_graph.svg.png)

_Depth First Seach_ is an algorithm that can find a subset of the edges of a graph that forms a tree from an node arbitrairly chosen as the root. Any edges not included in the tree are called _back edges_ and often indicated with a curved arrow. The tree and back edges together are known as the _DFS-Orientation_. After constructing this tree, each edge now has a direction, so we will use terminogy like the _source_ or _destination_ of an edge, or such synonyms.

**Different Kinds of Nodes on a tree**: ![Different Kinds of Tree](https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Tree_edges.svg/330px-Tree_edges.svg.png) Note: The algorithm will not normally generate any cross edges so we will ignore them.

A _loop_ is a cycle in a tree. Since a tree can not have loops every loop must contain at least one *back edge. The *low point* of a loop is the point on the loop with the smallest depth. The *low point\* of an edge
is the lowest low point of a cycle that includes the edge. If the edge is not part of any cycles, the low point is defined to be the end of the edge. (Up the tree for a back edge, down the tree for a tree edge)

**Caviat** The depth of a tree is defined as the distance from the root node. Thus, back edges are not included and a node can have a high depth even when connected directly to the root node via a back edge.

### T-alike or T-opposite edges

We define a _branch point_ as a tree edge _e_ such that multiple edges emerge from it's destination excluding _e_. This could be both tree edges or back edges.

We know each loop that passes through _e_ must pass through either of the branches.

For each pair of edges e<sub>0</sub> and e<sub>1</sub> emerging from the destination of _e_, we can divide the edges into two categories:

- All _return_ edges from e<sub>0</sub> with a low point strictly greater than the low point of e<sub>1</sub>
- All _return_ edges from e<sub>1</sub> with a low point strictly greater than the low point of e<sub>0</sub>.

The edges in the categories must be _T-alike_ other loops in the same category and _T-opposite_ loops in the other.

The intuition for this is essentially that if a return edge has a greater low point, it must be either inside the loop or on the the opposite side. However, the edges emerging from a branch point must branch in a certain order for the graph to be planar, thus inner loops must either be all inside or all outside.

### Converting these edges to a decission

If it's possible to assign an arbitrary direction (clockwise or anticlockwise) to each edge such that all _T-alike_ edges have the same direction and _T-opposite_ have the opposite direction, then the graph is planar.

### Psuedocode

A psuedocode algorithm is given as follows. First, we do a depth first search to divide the tree into
_tree edges_ and _back edges_

```
function depth first seach(graph)
    root = arbitrary node of graph
    tree = Tree(root)

    current node = root
    while true
        for child in current node:
            if child in tree:
                tree.add_back_edge(current node, child)
            fi
        rof

        if current node has children:
            tree.add(first child of current node)
            current_node = first child of current node
        else
            current_node = nearest parent with unexplored child
        fi
    elihw
end
```

Next, we compute the _low point_ of every edge. We want the lowest depth of any cycle so the easiest
way to to start with the highest cycle then go lower overwriting values when you come across them.

```
function compute low points(graph)
    # Set the default value for edges not part of any loop
    for edge in graph
        edge.low_point = edge.destination.depth
    rof

    for back edge in graph.back_edges ordered by depth of source descending:
        let node = back edge.source
        while node is not back edge.destination
            edge(node, node.parent).low_point = back_edge.low_point
            node = node.parent
        elihw
    rof
```

Finally, we can divide the edges into _T-alike_ or _T-opposite_. We will define each loop by it's back edge.

```
function group loops(graph)
    for each branch B in the graph:
        let e be the edges emerging from B (both back and tree).
        for each pair of edges e0 and e1 in e:
            let w be all the back edges reachable from e0

            let group_one and group_two be sets;
            for each back edge q in w:
                if q point > s2.low_point:
                    group_one.add(q)
                fi
            rof

            let w be all the back edges reachable from e1
            let group_two and group_two be sets;
            for each back edge q in w:
                if q point > s2.low_point:
                    group_two.add(q)
                fi
            rof

            graph.set_t_opposite(t1, t2)
            graph.set_t_same(t1)
            graph.set_t_same(t2)
        rof
    rof
end
```

Now you can trivially assing an arbitrary direction to a back edge, then apply the opposite or the same direction to all back edges depending on the _T-same_ or _T-opposite_ rules. If it's possible
to do so, the graph is planar, if not, the graph is not.

## How to run the code

The library part, `graphs.ts` should run in any runtime, but the `test_suite.ts` should be run with Deno. To test the suite run `deno --allow-read="./test_cases" src/test_suite.ts`.

Currently it takes about a second to run the entire test suite.