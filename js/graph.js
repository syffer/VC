/*
* http://bl.ocks.org/rkirsling/5001347 
*
*/
"use strict";



/**
 * Retourne un nombre aléatoire compris dans l'intervalle [min;max]
 * @param   {number} min le minimal possible de la valeur aléatoire
 * @param   {number} max le maximal possible de la valeur aléatoire
 * @returns {number} le nombre aléatoire calculé 
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



function Node(id) {
    this.id = id;
}

function Link(source, target, cost = 1) { 
    if (source.id > target.id) [source, target] = [target, source];
    
    this.source = source;
    this.target = target; 
    this.cost = cost; 
}


function Graph() {
    let nodes = {};
    let links = [];
    
    function getCorrespondingNode(idOrNode) { 
        if (idOrNode instanceof Node) return idOrNode; 
        return self.getNode(idOrNode);
    }
    
    let self = { 
        nodes: nodes, 
        links: links, 
        
        addNode: function (id) {
            if (nodes[id] !== undefined) throw "an existing node with that id already exists";
            
            let node = new Node(id);
            nodes[id] = node;
            //nodes.push(node);
            
            return this; 
        },
        
        addLink: function (sourceNode, targetNode, cost = 1) { 
            let source = getCorrespondingNode(sourceNode);
            let target = getCorrespondingNode(targetNode);
            
            if (source === undefined) throw "source node doesn't exists";
            else if (target === undefined) throw "target node doesn't exists";
            
            if (source.id > target.id) [source, target] = [target, source];
            let index = links.findIndex(link => link.source === source && link.target === target);
            if (index !== -1) throw "link already existing between those two nodes : " + source.id + " > " + target.id;
            
            let link = new Link(source, target, cost);
            links.push(link);
            
            return this;
        }, 
        
        getNode: function (idNode) { 
            if (nodes[idNode] === undefined) throw "no node with that id exists : " + idNode; 
            return nodes[idNode];
        },
        
        getLink: function (idSourceNode, idTargetNode) {
            let source = getCorrespondingNode(idSourceNode);
            let target = getCorrespondingNode(idTargetNode);
            
            if (source.id > target.id) [source, target] = [target, source];
            
            let link = links.find(link => link.source == source && link.target == target);
            if (link === undefined) throw "no links between the two given nodes : " + source.id + " > " + target.id;
            
            return link;
        },
        
        getNbNodes: function () {
            return Object.keys(nodes).length;
        }, 
        
        getNbLinks: function () {
            return links.length;
        }, 
        
        getNeighborhood: function () {
            let neighbors = {};
            
            links.forEach(function (link) {
                neighbors[link.source.id] = neighbors[link.source.id] || [];
                neighbors[link.target.id] = neighbors[link.target.id] || [];

                neighbors[link.source.id].push(link.target.id);
                neighbors[link.target.id].push(link.source.id);
            });
            
            return neighbors;
        }
    };
    
    return self;    
}


function createRandomGraph(nbNodes = 10, nbLinksPerNode = 3, minCost = 1, maxCost = 30) {
    if (nbNodes < 0) throw "nbNodes must be greater than 0";
    if (nbNodes === 1 && nbLinksPerNode > 0) nbLinksPerNode = 0;
    if (minCost > maxCost) throw "minimal cost must be inferior to maximal cost";
    
    function getOtherId(id, nodesId) {
        let otherIndex = -1; 
        let otherId = id; 
        
        do {
            otherIndex = random(0, nbNodes - 1);
            otherId = nodesId[otherIndex];
        } while (otherId === id);
        
        return otherId;
    }
    
    
    let graph = new Graph();
    
    // creates the nodes
    Array.apply(null, Array(nbNodes)).forEach(function (elem, index, table) {
        graph.addNode(index);
    });
    
    // creates the links 
    Object.keys(graph.nodes).forEach(function (id, index, nodesId) { 
        
        for(let i = 0; i < nbLinksPerNode; i++) { 
            let otherId = getOtherId(id, nodesId);
            let cost = random(minCost, maxCost);
            
            try {
                graph.addLink(id, otherId, cost);
            }
            catch (e) {
                
            }
        }
        
    });
        
    return graph;
}




function getRandomCycle(graph, startingNode) {
        
    function rec(neighborhood, actual, cycle, cycleLength) {        
        let possibilities = neighborhood[actual];
        neighborhood[actual] = undefined;
                
        let findCycle = possibilities.some(function (possibility) { 
            
            if (cycleLength === graph.getNbNodes()-1 && possibility === startingNode) {
                cycle.push(possibility);
                return true;
            } else if (neighborhood[possibility] !== undefined && rec(neighborhood, possibility, cycle, cycleLength+1)) {
                cycle.push(possibility);
                return true;
            }
                   
            return false;
        });
                
        if (!findCycle) neighborhood[actual] = possibilities;
        return findCycle;
    }
        
    let neighborhood = graph.getNeighborhood();
    
    // randomize the arrays (not a good solution)
    Object.values(neighborhood).forEach(list => list.sort(() => (Math.random()*3) - 1));
    
    let cycle = [];
    let hasCycle = rec(neighborhood, startingNode, cycle, 0);    
    
    if (!hasCycle) throw "the given graph doesn't possess any hamiltonian cycle";
    
    return cycle;
}




