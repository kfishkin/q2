import prepsConfig from './config/preps.json';

class Preps {
    constructor() {
        this.prepsMap = {};
        prepsConfig.preps.forEach((bundle) => {
            this.prepsMap[bundle.prepId] = bundle;
        });
    }

    /* given an id, return the ingredient, null if none */
    byId(id) {
        return (id in this.prepsMap) ? this.prepsMap[id] : null;
    }

    /* return an array of all ingredients in random order */
    Dump() {
        return Object.values(this.prepsMap);
    }
}
export default Preps;