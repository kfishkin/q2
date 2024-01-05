import stepConfigId from './config/step_configs.json';

class StepConfigs {
    constructor() {
        this.stepConfigMap = {};
        stepConfigId.step_configs.forEach((bundle) => {
            this.stepConfigMap[bundle.stepConfigId] = bundle;
            console.log(bundle);
        });
    }

    /* given an id, return the step config, null if none */
    byId(id) {
        return (id in this.stepConfigMap) ? this.stepConfigMap[id] : null;
    }

    /* return an array of all step_configs in random order */
    Dump() {
        return Object.values(this.stepConfigMap);
    }

    /* how many possiblities does a given step config have */
    NumPossibilities(step_config) {
        if (step_config == null) return 0;
        if (!(step_config.stepConfigId in this.stepConfigMap)) return 0;
        return step_config.possibleIngredients.length
           * step_config.possiblePreps.length;
    }
}
export default StepConfigs;