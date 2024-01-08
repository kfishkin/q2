export const SCORE_HIT = 1;
export const SCORE_UNKNOWN = 0;
export const SCORE_MISS = 2;
export const SCORE_ELSEWHERE = 3;
export const ATTEMPT_UNKOWN = 0;

class Attempt {
    constructor() {
        this.recipeId = 0;
        this.steps = [];
        this.ingredScores = [];
        this.prepScores = [];
    }

    static scoreToText(score) {
        switch (score) {
            case SCORE_HIT: return "HIT";
            case SCORE_ELSEWHERE: return "elsewhere";
            case SCORE_MISS: return "miss";
            case SCORE_UNKNOWN: return "???";
            default: return score;
        }
    }

    /**
     * Make a new attempt for the given recipe in the list of recipes.
     */
    static fromRecipe(recipes, recipeId) {
        if (!recipes || !recipeId || !(recipeId in recipes.AllRecipes())) {
            return [];
        }
        let ans = new Attempt();
        ans.recipeId = recipeId;
        ans.steps = recipes.ExpandedSteps(recipeId);
        // however, reset each guess to unknown....
        ans.steps.forEach((step) => {
            step.ingredient = ATTEMPT_UNKOWN;
            step.prep = ATTEMPT_UNKOWN;
        });
        // make something of the same length as (ans.steps),
        // then map over each element and put in a zero.
        // thank you google :)
        ans.ingredScores = Array.from(ans.steps, (_) =>  SCORE_UNKNOWN )
        ans.prepScores = Array.from(ans.steps, (_) =>  SCORE_UNKNOWN )
        return ans;
    }

    /** 
     * Scores this attempt against the given recipe.
     * Returns the (ingredScores) and (prepScores) as a tuple
     * of size 2
     */
    ScoreAgainst(recipe) {
        let ingredScores = Array.from(recipe.steps, (_) =>  SCORE_MISS )
        let prepScores = Array.from(recipe.steps, (_) =>  SCORE_MISS )
        // foreach step R in the recipe
        //   foreach step A in the attempt
        //      if R == A, this is a win if on the same step, a 'near' if not already a hit o.w.
        recipe.steps.forEach((rStep, rIndex) => {
            let rIngred = rStep.ingredient;
            let rPrep = rStep.prep;
            this.steps.forEach((attStep, attIndex) => {
                let aIngred = attStep.ingredient;
                let aPrep = attStep.prep;
                console.log('recipe step', rIndex, 'prep ', rPrep, 'ingred ', rIngred, ' vs. step ', attIndex, 'aPrep', aPrep, 'aIngred', aIngred);
                if ((rIngred == aIngred) && (rIngred != ATTEMPT_UNKOWN)) {
                    // we have either a winner, or a near-miss....
                    if (rIndex == attIndex) {
                        ingredScores[attIndex] = SCORE_HIT;
                        console.log('winner ingredient');
                    } else if (ingredScores[attIndex] != SCORE_HIT) {
                        ingredScores[attIndex] = SCORE_ELSEWHERE;
                        console.log('near-miss ingredient');
                    }
                }
                if ((rPrep == aPrep) && (rPrep != ATTEMPT_UNKOWN)) {
                    // we have either a winner, or a near-miss....
                    if (rIndex == attIndex) {
                        prepScores[attIndex] = SCORE_HIT;
                        console.log('winner prep');
                    } else if (prepScores[attIndex] != SCORE_HIT) {
                        prepScores[attIndex] = SCORE_ELSEWHERE;
                        console.log('near-miss prep');
                    }
                }                

            });

        });
        return [ingredScores, prepScores];
    }



}
export default Attempt;