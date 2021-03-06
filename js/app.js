"use strict";


let Events = Object.freeze({
    INITIALIZE_GRAPH: "EVENT:INITIALIZE_GRAPH", 
    GRAPH_UPDATED: "EVENT:GRAPH_UPDATED", 
});






function Model() {
    let self; 
    let controller; 
    
    // al 
    
    self = {
        graph: createRandomGraph(), 
                
        getGraphNodes: function () {
            return d3.values(this.graph.nodes);
        }, 
        
        getGraphLinks: function () {
            return this.graph.links;
        },
        
        onInitializeGraphEvent: function (sender, nbNodes, nbInputLinks, nbOutputLinks) { 
            this.graph = createRandomGraph(nbNodes, nbInputLinks, nbOutputLinks);
            controller.trigger(Events.GRAPH_UPDATED, this);
        },
        
        setController: function (newController) {
            controller = newController;
        },
    };
        
    return self;
}




function View(controller, model) { 
    let self; 
    
    let svg; 
    let force;  // d3.js graph  
    
    // handles to link and node element groups 
    let path;     
    let circle; 
    let weight;
    
    let width = 1260;
    let height = 700;
    
    let buttonNewGraph;
    let sliderNbNodes;
    let sliderNbLinks;
    let sliderNbPopulation;
    
    /**
     * Initializes the view by 
     * - creating the SVG tag 
     * - adding the html events 
     */
    function initialize() {
        initializeSVG();
        
        // handles to link and node element groups  
        path = svg.append("svg:g").selectAll("path");
        circle = svg.append("svg:g").selectAll("g");
        weight = svg.append("svg:g").selectAll("text");
        
        // links to html events 
        buttonNewGraph = document.getElementById("buttonNewGraph");
        buttonNewGraph.onclick = onNewGraphButtonEvent;
        
        // creates the sliders 
        sliderNbNodes = new Slider("#sliderNbNodes", {tooltip_position:'bottom'}); 
        sliderNbLinks = new Slider("#sliderNbLinks", {});
        sliderNbPopulation = new Slider("#sliderNbPopulation", {});
        sliderMutationLevel = new Slider("#sliderMutationLevel", {});
    }
    
    /**
     * Initializes the SVG tag 
     */
    function initializeSVG() {
        // creates the svg tag 
        svg = d3.select("body").append("svg").attr({
            width: width, 
            height: height,
        });
        
        // arrow markers for graph links 
        let svgDefs = svg.append("svg:defs");

        let svgMarker = svgDefs.append("svg:marker").attr({
            id: "end-arrow", 
            viewBox: "0 -5 10 10", 
            refX: 25, 
            refY: -1.5, 
            markerWidth: 6,
            markerHeight: 6, 
            orient: "auto",
        });

        let svgPath = svgMarker.append("svg:path").attr({
            d: "M0,-5L10,0L0,5",
        });
    }
    
    
    
    /**
     * Initializes the d3.js force, the graph
     */
    function initializeForce() {
        force = d3.layout.force()
            .nodes(model.getGraphNodes())
            .links(model.getGraphLinks())
            .size([width, height])
            .linkDistance(350)
            .charge(-500)
            .on("tick", tick);
    }
    

    /**
     * Draws the graph elements at a calculated position. 
     * Called periodically. 
     * @see Model.initializeForce()
     */
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
    
    
    function updateGraphView() {
        updateLinksView();
        updateWeightView();
        updateNodeView();
        
        force.start();
    }
    
    function updateLinksView() {
        path = path.data(model.getGraphLinks());
        
        // update existing links 
        
        path.enter().append("svg:path")
            .attr("class", "link")
            .style("marker-start", "")
            .style("marker-end", "");   // url(#end-arrow)
        
        path.exit().remove();
    }
    
    
    function updateWeightView() {
        weight = weight.data(model.getGraphLinks());
        
        // updates weights
        
        weight.enter().append("svg:text").text(function (link) {
            return link.cost;
        });

        weight.exit().remove();
    }
    
    function updateNodeView() {        
        circle = circle.data(model.getGraphNodes(), function (node) { 
            return node.id;
        });
        
        // adds new nodes
        let g = circle.enter().append("svg:g");
        g.append("svg:circle").attr({
            class: "node", 
            r: 12, 
        });
        
        // adds the text at the center 
        g.append("svg:text").attr({
            x: 0, 
            y: 4,
        }).text(function (node) { 
            return node.id;
        });
        
        circle.exit().remove();
    }
    
    
    function onNewGraphButtonEvent() { 
        let nbNodes = sliderNbNodes.getValue();
        let nbLinks = sliderNbLinks.getValue();
        
        controller.trigger(Events.INITIALIZE_GRAPH, self, nbNodes, nbLinks);
    }
    
    self = {         
        show: function () { 
            initializeForce(); 
            updateGraphView();
        },
        
        redrawGraph: function () {
            initializeForce();
            updateGraphView();
        },
    };
    
    
    initialize();
    return self;
}




function Controller(model) { 
    let mediator = new EventBus();
    
    function initialize() {
        model.setController(self);
        
        // create the view
        self.view = new View(self, model);
        self.view.show();
                
        // add the events
        mediator.on(Events.INITIALIZE_GRAPH, model.onInitializeGraphEvent, model);
        mediator.on(Events.GRAPH_UPDATED, self.view.redrawGraph, self.view);
    }
    
    let self = {
        model: model,
        view: undefined, 
        
        mediator: mediator, 
        on: mediator.on, 
        off: mediator.off, 
        trigger: mediator.trigger, 
    };
    
    initialize();
    return self;
}


let model = new Model();
let controller = new Controller(model);


let g = model.graph;



