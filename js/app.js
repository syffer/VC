"use strict";

let width = 1260;
let height = 700;

// creates the initial graph 
let graph;
//console.log(graph.getNbLinks());


function newGraph() {
    console.log("new graph");
    graph = createRandomGraph(4);
}

newGraph();

// initialize d3 force layout 
let force = d3.layout.force()
    .nodes(d3.values(graph.nodes))
    .links(graph.links)
    .size([width, height])
    .linkDistance(350)
    .charge(-500)
    .on("tick", tick);


function tick() {
    path.attr({
        d: function (link) { 
            let dx = link.target.x - link.source.x;
            let dy = link.target.y - link.source.y;
            let dr = Math.sqrt(dx * dx + dy * dy);
                        
            return "M" + 
                link.source.x + "," + 
                link.source.y + "A" + 
                dr + "," + dr + " 0 0,1 " + 
                link.target.x + "," + 
                link.target.y;
        }, 
    });
    
    weight.attr("transform", function (link) {
        
        let dx = link.target.x - link.source.x;
        let dy = link.target.y - link.source.y;
        
        // norme 
        let nx = -(dy/2);
        let ny = (dx/2);
                
        // position 
        let division = 4; // 2.8 
        let x = link.source.x + (dx/2) - (nx/division);
        let y = link.source.y + (dy/2) - (ny/division);
                
        return "translate(" + x + "," + y + ")";
    })
    
    circle.attr("transform", function (node) { 
        return "translate(" + node.x + "," + node.y + ")";
    });
}


// creates the svg tag
let svg = d3.select("body").append("svg").attr({
    //oncontextmenu: "return false;",
    width: width, 
    height: height,
});

// arrow markers for graph links 
let svgDefs = svg.append("svg:defs");

let svgMarker = svgDefs.append("svg:marker").attr({
    id: "end-arrow", 
    //class: "end-arrow",
    viewBox: "0 -5 10 10", 
    refX: 25, 
    refY: -1.5, 
    markerWidth: 6,
    markerHeight: 6, 
    orient: "auto",
});

let svgPath = svgMarker.append("svg:path").attr({
    d: "M0,-5L10,0L0,5",
    //fill: "#666",
});


// handles to link and node element groups 
let path = svg.append("svg:g").selectAll("path");
let circle = svg.append("svg:g").selectAll("g");
let weight = svg.append("svg:g").selectAll("text");


function updateGraphView() {
    
    path = path.data(graph.links);
    
    // update existing links 
    
    // add new links 
    path.enter().append("svg:path")
        .attr("class", "link")
        .style("marker-start", "")
        .style("marker-end", "url(#end-arrow)");
    
    // remove old links
    path.exit().remove();
    
    
    weight = weight.data(graph.links);
    weight.enter().append("svg:text").text(function (link) {
        return link.cost;
    });
    
    weight.exit().remove();
    
    
    let nodes = d3.values(graph.nodes);
    circle = circle.data(nodes, function (node) { 
        return node.id;
    });
        
    
    // add new node
    let g = circle.enter().append("svg:g");
    
    g.append("svg:circle").attr({
        class: "node", 
        r: 12, 
    });
    
    
    // 
    
    g.append("svg:text").attr({
        x: 0, 
        y: 4,
    }).text(function (node) { 
        return node.id;
    });
    
    circle.exit().remove();
    
    force.start();
}



updateGraphView();

