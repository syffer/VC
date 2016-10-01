"use strict";



/**
 * [[Description]]
 * @param   {function} generatePopulation               [[Description]]
 * @param   {function} fitness                          [[Description]]
 * @param   {function} cross                            [[Description]]
 * @param   {function} mutate                           [[Description]]
 * @param   {number}   nbPopulation                     [[Description]]
 * @param   {function} select=AlgoGenetique.selectBests [[Description]]
 * @param   {number}   mutationLevel=0.2                [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function AlgoGenetique(generatePopulation, fitness, cross, mutate, nbPopulation, select=AlgoGenetique.selectBests, mutationLevel=0.2) { 
    if (mutationLevel < 0 || mutationLevel > 1) throw new Error("mutation level must be between 0 and 1 (included)");
    
    let eventBus = new EventBus();
    
    let generation = 0;
    let population = [];
    generateInitialPopulation(nbPopulation);
    
    function generateInitialPopulation(nbPopulation) {
        trigger(AlgoGenetique.Events.GENERATE_INITIAL_POPULATION);
        generation = 0;
        population = generatePopulation(nbPopulation);
    }
    
    this.nextGeneration = function() {
        generation++;
        selection();
        crossing();
        mutation();
        trigger(AlgoGenetique.Events.NEW_GENERATION, generation, population.slice());
    }
    
    function selection() {
        trigger(AlgoGenetique.Events.SELECTION, generation);
        population = select(fitness, population);
    }
    
    function crossing() {
        trigger(AlgoGenetique.Events.CROSSING, generation);
        
        let remainingIndivs = population.slice();
        
        while (remainingIndivs.length >= 2) {
            let index1 = random(0, remainingIndivs.length - 1);
            let indiv1 = remainingIndivs.pop(index1);
            
            let index2 = random(0, remainingIndivs.length - 1);
            let indiv2 = remainingIndivs.pop(index2);
            
            trigger(AlgoGenetique.Events.CROSSING_INDIVIDUALS, generation, indiv1, indiv2);
            let [child1, child2] = cross(indiv1, indiv2);
            
            population.push(child1);
            population.push(child2);
        }
        
    }
    
    function mutation() { 
        trigger(AlgoGenetique.Events.MUTATION, generation); 
        population.map(individual => (Math.random() < mutationLevel) ? mutateIndividual(individual) : individual);
    }
    
    function mutateIndividual(individual) {
        trigger(AlgoGenetique.Events.MUTATION_OCCURED, generation, individual);
        return mutate(individual);
    }
    
    function trigger(event, ...options) {
        eventBus.trigger(event, this, ...options);
    }
    
    
    this.setMutationLevel = function (newMutationLevel) {
        if (newMutationLevel < 0 || newMutationLevel > 1) throw new Error("mutation level must be between 0 and 1 (included)");
        mutationLevel = newMutationLevel; 
    }
    
    this.setSelectAlgorithm = function (newSelect) {
        select = newSelect;
    }
    
    this.reset = function () {
        generateInitialPopulation(nbPopulation);
    }
    
    this.getPopulation = function () {
        return population;
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

AlgoGenetique.selectTournament = function (fitness, list, selectLevel=0.2) { 
    if (selectLevel < 0 || selectLevel > 1) throw "'selectLevel' must be between 0 and 1 (included)";
    
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
}




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


function generer(nbPop) {
    let list = [];
    for(let i = 0; i < nbPop; i++) {
        list.push(random(0, 10));
    }
    return list;
}

function croiser(indiv1, indiv2) {
    return [indiv1+indiv2, indiv1-indiv2];
}

function muter(indiv) {
    return indiv + random(-indiv, indiv);
}

function h(indiv) {
    return indiv;
}


let al = new AlgoGenetique(generer, h, croiser, muter, 30);

al.on(AlgoGenetique.Events.NEW_GENERATION, (sender, ite, pop) => console.log(ite + " : " + pop));
al.on(AlgoGenetique.Events.SELECTION, (sender, ite) => console.log("- " + ite + " selection"));
al.on(AlgoGenetique.Events.CROSSING, (sender, ite) => console.log("- " + ite + " crossing"));
al.on(AlgoGenetique.Events.CROSSING_INDIVIDUALS, (sender, ite, i1, i2) => console.log("- " + ite + " crossing those : " + i1 + " " + i2));
al.on(AlgoGenetique.Events.MUTATION, (sender, ite) => console.log("- " + ite + " mutate"));
al.on(AlgoGenetique.Events.MUTATION_OCCURED, (sender, ite) => console.log("- " + ite + " mutate"));

al.getPopulation();
al.nextGeneration();