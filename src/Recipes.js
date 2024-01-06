import recipeConfig from './config/recipes.json';

class Recipes {
    // is it Invalid? returns why if invalid, null otherwise.
    isInvalid(recipe, idsSeen, stepConfigs, ingredients, preps) {
        if (!recipe || !recipe.recipeId) {
            return "empty recipe";
        }
        if (recipe.recipeId in idsSeen) {
            return "id " + recipe.recipeId + " already seen";
        }
        if (!recipe.steps || recipe.steps.length === 0) {
            return 'recipe ' + recipe.recipeId + ' has no steps';
        }
        recipe.steps.forEach((step) => {
            let config = stepConfigs.byId(step.stepConfigId);
            if (!config) {
                return 'recipe' + recipe.recipeId
                  + ' step config #' + step.stepConfigId
                  + ' not found '
            }
            let ingredient = ingredients.byId(step.ingrdient);
            if (!ingredient) {
                return 'recipe ' + recipe.recipeId
                  + ' step config # ' + step.stepConfigId
                  + ' ingredient # ' + step.ingredient + ' not found';
            }
            // TOD: is this ingredient in the set of possibles
            // TODO: is this prep in the set of possibles
        });
        idsSeen[recipe.recipeId] = true;
        return null;
    }
    constructor() {
        this.recipeMap = {};
        recipeConfig.recipes.forEach((bundle) => {
            this.recipeMap[bundle.recipeId] = bundle;
            //console.log(bundle);
        });
    }

    /* given an id, return the ingredient, null if none */
    byId(id) {
        return (id in this.recipeMap) ? this.recipeMap[id] : null;
    }

    /* return an array of all ingredients in random order */
    Dump() {
        return Object.values(this.recipeMap);
    }
}
export default Recipes;