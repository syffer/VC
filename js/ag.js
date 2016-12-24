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
 * @param {number}   nbPopulation                     the number of individuals in the population (i.e. the population length)
 * @param {function} select=AlgoGenetique.selectBests the selection algorithm
 * @param {number}   mutationLevel=0.2                the mutation level
 */
function AlgoGenetique(nbPopulation, select=AlgoGenetique.selectBests, mutationLevel=0.2) { 
    if (this.constructor === AlgoGenetique) throw new Error("Can't instantiate abstract class");
    if (mutationLevel < 0 || mutationLevel > 1) throw new Error("Mutation level must be between 0 and 1 (included)");
    
    let self = this;
    let eventBus = new EventBus();
    
    let generation = 0;
    let population = []; 
    
    /*
    this.generatePopulation = function (nbPopulation) { throw new Error("Abstract method"); };
    this.fitness = function (individual) { throw new Error("Abstract method"); };
    this.cross = function (indiv1, indiv2) { throw new Error("Abstract method"); };
    this.mutate = function (individual) { throw new Error("Abstract method"); };
    */
    
    /**
     * Generates the initial population. 
     * Triggers the event "GENERATE_INITIAL_POPULATION" before generating it.
     */
    this.generateInitialPopulation = function () {
        trigger(AlgoGenetique.Events.GENERATE_INITIAL_POPULATION);
        generation = 0;
        population = this.generatePopulation(nbPopulation);        
        trigger(AlgoGenetique.Events.INITIAL_POPULATION_GENERATED, population.slice());
    }
    
    /**
     * Generates the next generation of the population by selecting, crossing and mutating the individuals.
     */
    this.nextGeneration = function () {
        generation++;
        trigger(AlgoGenetique.Events.GENERATING_NEXT_GENERATION, generation);
        selection();
        crossing();
        mutation();
        trigger(AlgoGenetique.Events.NEW_GENERATION, generation, population.slice());
    }
    
    /**
     * The selection step. Uses the select algorithm that can be given during the instanciation. 
     */
    function selection() {
        trigger(AlgoGenetique.Events.SELECTION, generation);
        population = select(self.fitness, population);
    }
    
    /**
     * The crossing step. Chooses ramdomly two individuals to cross, and adds the result (children) in the population.
     * Uses the cross function which must return two children in a list. 
     */
    function crossing() {
        trigger(AlgoGenetique.Events.CROSSING, generation);
        
        let remainingIndivs = population.slice();   //[...population]; // 
        
        while (remainingIndivs.length >= 2) {
            let index1 = random(0, remainingIndivs.length - 1);
            let [indiv1] = remainingIndivs.splice(index1, 1);
            
            let index2 = random(0, remainingIndivs.length - 1);
            let [indiv2] = remainingIndivs.splice(index2, 1);
            
            trigger(AlgoGenetique.Events.CROSSING_INDIVIDUALS, generation, [indiv1, indiv2]);
            let [child1, child2] = self.cross(indiv1, indiv2);
            trigger(AlgoGenetique.Events.CROSSING_INDIVIDUALS_RESULTS, generation, [indiv1, indiv2], [child1, child2]);
            
            population.push(child1, child2);
        }
        
    }
    
    /**
     * Mutation step. Each individual of the population can mutate independantly of the other.  
     */
    function mutation() { 
        trigger(AlgoGenetique.Events.MUTATION, generation); 
        population.map(individual => (Math.random() < mutationLevel) ? mutateIndividual(individual) : individual);
    }
    
    function mutateIndividual(individual) {
        let mutatedIndividual = self.mutate(individual);
        trigger(AlgoGenetique.Events.MUTATION_OCCURED, generation, individual, mutatedIndividual);
        return mutatedIndividual;
    }
    
    /**
     * Triggers the given event with some options
     * @param {string} event      the event to trigger
     * @param {object} ...options arguments variadiques restant
     */
    function trigger(event, ...options) { 
        eventBus.trigger(event, self, ...options);
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
    
    /**
     * Returns the number of individuals in the population. 
     * @returns {number} the number of individuals in the population. 
     */
    this.getNbPopulation = function () {
        return nbPopulation;
    }
    
    this.on = eventBus.on;
    this.once = eventBus.once;
    this.off = eventBus.off;
    
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
            let [best] = list.splice(index1, 1);

            let index2 = random(0, list.length - 1);
            let [worse] = list.splice(index2, 1);
            
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
    INITIAL_POPULATION_GENERATED: "al_initial_population_generated",
    GENERATING_NEXT_GENERATION: "al_generating_next_generation",
    NEW_GENERATION: "al_new_generation",
    SELECTION: "al_selection", 
    CROSSING: "al_crossing", 
    CROSSING_INDIVIDUALS: "al_cross_individuals",
    CROSSING_INDIVIDUALS_RESULTS: "al_cross_individuals_results",
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

al.on(AlgoGenetique.Events.GENERATE_INITIAL_POPULATION, () => console.log("generate initial population"));
al.on(AlgoGenetique.Events.INITIAL_POPULATION_GENERATED, (_, population) => console.log("initial population : " + population));
al.on(AlgoGenetique.Events.NEW_GENERATION, (sender, ite, pop) => console.log(ite + " : " + pop));
al.on(AlgoGenetique.Events.SELECTION, (sender, ite) => console.log("- " + ite + " selection step"));
al.on(AlgoGenetique.Events.CROSSING, (sender, ite) => console.log("- " + ite + " crossing step"));
al.on(AlgoGenetique.Events.CROSSING_INDIVIDUALS, (sender, ite, [i1, i2]) => console.log("- " + ite + " crossing : " + i1 + " " + i2));
al.on(AlgoGenetique.Events.MUTATION, (sender, ite) => console.log("- " + ite + " mutate step"));
al.on(AlgoGenetique.Events.MUTATION_OCCURED, (sender, ite) => console.log("- " + ite + " mutate"));

al.generateInitialPopulation();
al.nextGeneration();



/* ------------------- mini test graph ------------------- */


function AlgoGenetiqueGraph(graph, nbPopulation) {
    AlgoGenetique.call(this, nbPopulation);
    
    let bestDistance = 0;
    let distances = new WeakMap();
    
    this.on(AlgoGenetique.Events.GENERATING_NEXT_GENERATION, function (al, nextGenerationNumber) {
        al.getPopulation().forEach(function (cycle, index) {
            let d = distance(graph, cycle);
            if (!distances.has(cycle)) distances.set(cycle, d);
            if (d > bestDistance) bestDistance = d;
        });
    });
    
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
        let d = distances.get(cycle) - (0.99 * bestDistance);
        console.log(d + " " + cycle + " " + distances.get(cycle) + " " + bestDistance);
        return 1 / (d*d*d);
    }
    
    this.cross = function (cycle1, cycle2) {
        return [cycle1, cycle2];
        //throw new Error("Not implemented yet");
    }
    
    this.mutate = function (cycle) { 
        return cycle;
        //throw new Error("Not implemented yet");        
    }
    
    
    function distance(graph, cycle) {
        return cycle.reduce(function (acc, node, index) { 
            let nextNode = cycle[(index + 1) % cycle.length];
            let link = graph.getLink(node, nextNode);
            return acc + link.cost;
        }, 0);
    }
    
}



AlgoGenetiqueGraph.prototype = Object.create(AlgoGenetique);
AlgoGenetiqueGraph.prototype.constructor = AlgoGenetiqueGraph;




function test(cycle, i, j) {
    if (i > j) [i, j] = [j, i];
    if (i === j) throw new Error("pas possible");
    
    let afterJ = cycle.splice(j+1, cycle.length - (j+1));
    let beforeI = cycle.splice(0, i+1); 
    afterJ.push(...beforeI);
    afterJ.reverse();
    cycle.push(...afterJ);
    return cycle;
}



let ALG = AlgoGenetiqueGraph;

//let alg = new AlgoGenetiqueGraph(graph, 30);
//alg.generateInitialPopulation();
