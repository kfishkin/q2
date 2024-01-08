import ingredientConfig from './config/ingredients.json';

class Ingredients {
    constructor() {
        this.ingredientMap = {};
        ingredientConfig.ingredients.forEach((bundle) => {
            this.ingredientMap[bundle.ingredientId] = bundle;
            //console.log(bundle);
        });
    }

    /* given an id, return the ingredient, null if none */
    byId(id) {
        return (id in this.ingredientMap) ? this.ingredientMap[id] : null;
    }

    /* return an array of all ingredients in random order */
    Dump() {
        return Object.values(this.ingredientMap);
    }
}
export default Ingredients;