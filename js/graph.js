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
            
            let index = links.findIndex(function (link) {
                return link.source === source && link.target === target;
            });
            
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
            
            let link = links.find(function (l) {
                return l.source == source && l.target == target;
            });
    
            if (link === undefined) throw "no links between the two given nodes : " + source.id + " > " + target.id;
            return link;
        },
        
        getNbNodes: function () {
            return Object.keys(nodes).length;
        }, 
        
        getNbLinks: function() {
            return links.length;
        }
    };
    
    return self;    
}


function createRandomGraph(nbNodes = 10, nbInputLinksPerNode = 2, nbOutputLinksPerNode = 2, minCost = 1, maxCost = 30) {
    
    function getOtherId(id, nodesId) {
        let otherIndex = -1; 
        let otherId = id; 
        
        do {
            otherIndex = random(0, nbNodes - 1);
            otherId = nodesId[otherIndex];
        } while (otherId === id);
        
        return otherId;
    }
    
    if (nbNodes < 0) throw "nbNodes must be greater than 0";
    if (nbNodes === 1 && nbInputLinksPerNode > 0) nbInputLinksPerNode = 0;
    if (nbNodes === 1 && nbOutputLinksPerNode > 0) nbOutputLinksPerNode = 0;
    
    let graph = new Graph();
    
    // creates the nodes
    Array.apply(null, Array(nbNodes)).forEach(function (elem, index, table) {
        graph.addNode(index);
    });
        
    // creates the links (input and output)
    Object.keys(graph.nodes).forEach(function (id, index, nodesId) { 
        
        // inut links 
        for(let i = 0; i < nbInputLinksPerNode; i++) { 
            let otherId = getOtherId(id, nodesId);
            let cost = random(minCost, maxCost);
            
            try {
                graph.addLink(id, otherId, cost);
            }
            catch (e) {
                
            }
        }
        
        // output links 
        for(let i = 0; i < nbOutputLinksPerNode; i++) {
            let otherId = getOtherId(id, nodesId);
            let cost = random(minCost, maxCost);
            
            try {
                graph.addLink(otherId, id, cost);
            }
            catch (e) {
                
            }
        }        
    });
        
    return graph;
}
