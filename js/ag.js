"use strict";

/*
- sorting à modifier
- muter, croiser et fitness pour graph
- start, pause
- affichage des résultats (liste + couleurs sur graphe) 
*/

/**
 * [[Description]]
 * @throws {Error} [[Description]]
 * @param {number}   nbPopulation                     [[Description]]
 * @param {function} select=AlgoGenetique.selectBests [[Description]]
 * @param {number}   mutationLevel=0.2                [[Description]]
 */
function AlgoGenetique(nbPopulation, select=AlgoGenetique.selectBests, mutationLevel=0.2) { 
    if (this.constructor === AlgoGenetique) throw new Error("Can't instantiate abstract class");
    if (mutationLevel < 0 || mutationLevel > 1) throw new Error("Mutation level must be between 0 and 1 (included)");
    
    let eventBus = new EventBus();
    
    let generation = 0;
    let population = []; 
    
    /*
    this.generatePopulation = function (nbPopulation) { throw new Error("Abstract method"); };
    this.fitness = function (individual) {};
    this.cross = function (indiv1, indiv2) {};
    this.mutate = function (individual) {};
    */
    
    /**
     * Generates the initial population. 
     * Triggers the event "GENERATE_INITIAL_POPULATION" before generating it.
     */
    this.generateInitialPopulation = function () {
        trigger(AlgoGenetique.Events.GENERATE_INITIAL_POPULATION);
        generation = 0;
        population = this.generatePopulation(nbPopulation);        
    }
    
    /**
     * Generates the next generation of the population by selecting, crossing and mutating the individuals.
     */
    this.nextGeneration = function () {
        generation++;
        selection.call(this);
        crossing.call(this);
        mutation.call(this);
        trigger(AlgoGenetique.Events.NEW_GENERATION, generation, population.slice());
    }
    
    function selection() {
        trigger(AlgoGenetique.Events.SELECTION, generation);
        population = select(this.fitness, population);
    }
    
    function crossing() {
        trigger(AlgoGenetique.Events.CROSSING, generation);
        
        let remainingIndivs = population.slice();   //[...population]; // 
        
        while (remainingIndivs.length >= 2) {
            let index1 = random(0, remainingIndivs.length - 1);
            let indiv1 = remainingIndivs.pop(index1);
            
            let index2 = random(0, remainingIndivs.length - 1);
            let indiv2 = remainingIndivs.pop(index2);
            
            trigger(AlgoGenetique.Events.CROSSING_INDIVIDUALS, generation, indiv1, indiv2);
            let [child1, child2] = this.cross(indiv1, indiv2);
            
            population.push(child1, child2);
        }
        
    }
    
    /**
     * Mutation step. Each individual of the population can mutate independantly of the other.  
     */
    function mutation() { 
        trigger(AlgoGenetique.Events.MUTATION, generation); 
        population.map(individual => (Math.random() < mutationLevel) ? mutateIndividual.call(this, individual) : individual);
    }
    
    function mutateIndividual(individual) {
        trigger(AlgoGenetique.Events.MUTATION_OCCURED, generation, individual);
        return this.mutate(individual);
    }
    
    /**
     * Triggers the given event with some options
     * @param {string} event      the event to trigger
     * @param {object} ...options arguments variadiques restant
     */
    function trigger(event, ...options) {
        eventBus.trigger(event, this, ...options);
    }
    
    
    /**
     * Sets the mutation level of each individuals. 
     * Must be between 0 and 1 (included)
     * @throws {Error} if the level isn't in the given range
     * @param {number} newMutationLevel the new mutation level
     */
    this.setMutationLevel = function (newMutationLevel) {
        if (newMutationLevel < 0 || newMutationLevel > 1) throw new Error("Mutation level must be between 0 and 1 (included)");
        mutationLevel = newMutationLevel; 
    }
    
    /**
     * Sets the selection algorithm to be use during the selection. 
     * @throws {Error} if the select algorithm isn't a function
     * @param {function(fitess, list)} newSelect the select algorithm that returns the selected population in a new list.
     */
    this.setSelectAlgorithm = function (newSelect) { 
        if (typeof newSelect !== "function") throw new Error("A function was expected");
        select = newSelect;
    }
        
    /**
     * Returns the population (not a copy). 
     * @returns {array} the population
     */
    this.getPopulation = function () {
        return population;
    }
    
    /**
     * Returns the generation number. 
     * @returns {number} the generation number.
     */
    this.getGenerationNumber = function () {
        return generation;
    }
    
    this.on = eventBus.on;
    this.once = eventBus.once;
    this.off = eventBus.off;
    
    //generateInitialPopulation.call(this, nbPopulation);
    //this.generateInitialPopulation(nbPopulation);
}


AlgoGenetique.selectBests = function (fitness, list) {
    list.sort((indiv1, indiv2) => fitness(indiv1) - fitness(indiv2));
    list.splice(0, Math.floor(list.length / 2));
    return list;
}


AlgoGenetique.selectTournamentWithLevel = function (selectLevel) { 
    if (selectLevel < 0 || selectLevel > 1) throw "'selectLevel' must be between 0 and 1 (included)";
    
    return function (fitness, list) {
        let choosen = [];
        
        while (list.length >= 2) {
            let index1 = random(0, list.length - 1);
            let best = list.pop(index1);

            let index2 = random(0, list.length - 1);
            let worse = list.pop(index2);

            if (fitness(worse) > fitness(best)) [best, worse] = [worse, best];

            if (Math.random() < selectLevel) choosen.push(best)
            else choosen.push(worse); 
        }

        return choosen;
    };
}

AlgoGenetique.selectTournament = AlgoGenetique.selectTournamentWithLevel(0.9);


AlgoGenetique.Events = {
    GENERATE_INITIAL_POPULATION: "al_generate_initial_population", 
    NEW_GENERATION: "al_new_generation",
    SELECTION: "al_selection", 
    CROSSING: "al_crossing", 
    CROSSING_INDIVIDUALS: "al_cross_individuals",
    MUTATION: "al_mutation", 
    MUTATION_OCCURED: "al_mutation_occured",
};




/* ------------------- mini test ------------------- */




function TestEntier() {
    AlgoGenetique.apply(this, arguments);
    
    this.generatePopulation = function (nbPop) {
        let list = [];
        for(let i = 0; i < nbPop; i++) {
            list.push(random(0, 10));
        }
        return list;
    } 
    
    this.fitness = function (indiv) {
        return indiv;
    } 
    
    this.cross = function (indiv1, indiv2) {
        return [indiv1+indiv2, indiv1-indiv2];
    } 
    
    this.mutate = function (indiv) {
        return indiv + random(-indiv, indiv);
    } 
}

TestEntier.prototype = Object.create(AlgoGenetique); //new AlgoGenetique();
TestEntier.prototype.constructor = TestEntier;



let al = new TestEntier(30);

al.on(AlgoGenetique.Events.GENERATE_INITIAL_POPULATION, () => console.log("initial population created !"));
al.on(AlgoGenetique.Events.NEW_GENERATION, (sender, ite, pop) => console.log(ite + " : " + pop));
al.on(AlgoGenetique.Events.SELECTION, (sender, ite) => console.log("- " + ite + " selection"));
al.on(AlgoGenetique.Events.CROSSING, (sender, ite) => console.log("- " + ite + " crossing"));
al.on(AlgoGenetique.Events.CROSSING_INDIVIDUALS, (sender, ite, i1, i2) => console.log("- " + ite + " crossing those : " + i1 + " " + i2));
al.on(AlgoGenetique.Events.MUTATION, (sender, ite) => console.log("- " + ite + " mutate"));
al.on(AlgoGenetique.Events.MUTATION_OCCURED, (sender, ite) => console.log("- " + ite + " mutate"));

al.generateInitialPopulation();
al.nextGeneration();



/* ------------------- mini test graph ------------------- */


function AlgoGenetiqueGraph(graph, nbPopulation) {
    AlgoGenetique.call(this, nbPopulation);
    
    this.generatePopulation = function (nbCycles) {
        let idNodes = Object.keys(graph.nodes);
    
        function getRandomNode() {
            let randomIndex = random(0, graph.getNbNodes() - 1);
            let id = idNodes[randomIndex]; 
            return graph.nodes[id];
        }

        return Array.apply(undefined, Array(nbCycles)).map(() => getRandomCycle(graph, getRandomNode()));  
    }
    
    
    this.fitness = function (cycle) {
        
    }
    
    this.cross = function (cycle1, cycle2) {
        
    }
    
    this.mutate = function (cycle) {
        
    }
}



AlgoGenetiqueGraph.prototype = Object.create(AlgoGenetique);
AlgoGenetiqueGraph.prototype.constructor = AlgoGenetiqueGraph;


function distance(graph, cycle) {
    return cycle.reduce(function (acc, node, index) { 
        let nextNode = cycle[(index + 1) % cycle.length];
        let link = graph.getLink(node, nextNode);
        return acc + link.cost;
    }, 0);
}


let alg = new AlgoGenetiqueGraph(undefined, 30);
alg.generateInitialPopulation();
