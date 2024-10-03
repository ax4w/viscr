package main

import (
	"fmt"
	"sync"
)

type Graph struct {
	sync.Mutex
	Nodes map[string]map[string]int
}

func NewGraph() *Graph {
	return &Graph{
		Nodes: make(map[string]map[string]int),
	}
}

func (g *Graph) Add(n string) {
	if _, ok := g.Nodes[n]; !ok {
		g.Nodes[n] = make(map[string]int)
	}
}

func (g *Graph) Connect(n1, n2 string) {
	g.Add(n1)
	g.Add(n2)
	g.Nodes[n1][n2] += 1
}

func (g *Graph) Exists(n string) bool {
	_, ok := g.Nodes[n]
	return ok
}

func (g *Graph) PrintGraph() {
	for node, edges := range g.Nodes {
		fmt.Printf("Node %s:\n", node)
		for to, capacity := range edges {
			fmt.Printf("  -> Node %s (Capacity: %d)\n", to, capacity)
		}
	}
}
