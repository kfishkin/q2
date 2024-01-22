import React from 'react';
import StepConfigs from './step_config';
import { Button, Dropdown, Select, Space } from 'antd';
import Preps from './Preps';
import Ingredients from './Ingredients';
import Attempt, { ATTEMPT_UNKOWN } from './Attempt';

class GuessPage extends React.Component {
    /*
    * props:
    * recipes = the (Recipes) object
    */
    constructor(props) {
        super(props);
        this.state = {
            guessee: 0, // the recipe being guessed at. 0 = undef.
            attempt: null, // the current attempt against that recipe.
            heartbeat: false, // change to make component re-render
            ingredScores: [],
            prepScores: [],
        }
        this.stepConfigs = new StepConfigs();
        this.allPreps = new Preps();
        this.allIngredients = new Ingredients();
        this.recipes = props.recipes;
    }

    showRecipes() {
        const onClick = (e) => {
            console.log('e.key = ', e.key);
            let guessee = parseInt(e.key);
            let attempt = Attempt.fromRecipe(this.recipes, guessee);
            console.log('attempt = ', attempt);
            this.setState({ guessee: guessee, attempt: attempt });
        };
        let items = this.props.recipes.Dump().map((recipe) => {
            return (
                {
                    label: recipe.name,
                    key: recipe.recipeId
                }
            )
        });
        return <div>
            <Dropdown.Button menu={{ items, onClick }} arrow={true}>
                <Space>
                    <span>Pick a recipe by clicking on my dropdown</span>
                </Space>
            </Dropdown.Button>
        </div>;
    }

    showStepChoices(steps) {
        let header = <tr><th>Step #</th><th>Possible preparations</th><th>Possible Ingredients</th><th># possibilities</th></tr>;
        let numPossibilities = 1;
        let component = this;
        let onPrepSelect = function(e, opt) {
            // opt.step has the step #
            // opt.key, and e, both have the prep Id.
            // (steps) is the step in the _recipe_. we want the steps in the _attempt_
            console.log('on prep select', e, opt);
            let stepId = opt.step || 0;
            let prepId = opt.key;
            //steps[stepId].prep = prepId;
            // ok not to copy the object?
            component.state.attempt.steps[stepId].prep = prepId;
            component.setState({ heartbeat: !component.state.heartbeat});

        }
        let onIngredSelect = function(e, opt) {
            console.log('on ingred select select', e, opt);
            let stepId = opt.step || 0;
            let ingredId = opt.key;
            component.state.attempt.steps[stepId].ingredient = ingredId;
            component.setState({ heartbeat: !component.state.heartbeat});
        }
        let body = steps.map((step, index) => {
            let stepConfigId = step.stepConfigId;
            let stepConfig = this.stepConfigs.byId(stepConfigId);
            if (stepConfig) {
                const DEFAULT_LABEL = "pick one...";
                let stepNum = index;
                let prepItems = [];
                prepItems.push(
                    {
                        label: DEFAULT_LABEL,
                        key: 0,
                        value: 0,
                        step: stepNum
                    }
                )
                numPossibilities *= stepConfig.possiblePreps.length;

                stepConfig.possiblePreps.forEach((prepId,) => {
                    let prep = this.allPreps.byId(prepId);
                    if (prep && prep.name) {
                        prepItems.push(
                            {
                                label: prep.name,
                                key: prepId,
                                value: prepId,
                                step: stepNum
                            }
                        );
                    }
                });


                let ingredItems = [];
                ingredItems.push(
                    {
                        label: DEFAULT_LABEL,
                        key: 0,
                        value: 0,
                        step: stepNum
                    }
                )
                
                stepConfig.possibleIngredients.forEach((ingredId) => {
                    let ingred = this.allIngredients.byId(ingredId);
                    if (ingred && ingred.name) {
                        ingredItems.push(
                            {
                                label: ingred.name,
                                key: ingredId,
                                value: ingredId,
                                step: stepNum
                            }
                        );
                    }
                });
                numPossibilities *= stepConfig.possibleIngredients.length;
                let prepClass = (step.prep !== ATTEMPT_UNKOWN) ? "guessed" : "unguessed";
                let ingredClass = (step.ingredient !== ATTEMPT_UNKOWN) ? "guessed" : "unguessed";
                console.log('step #', stepNum, 'prep ', step.prep, 'pClass', prepClass, 'ingred', step.ingredient, 'iClass', ingredClass);
                return (<tr><td>{stepNum + 1}</td>
                    <td><Select className={prepClass} options={prepItems} defaultValue={DEFAULT_LABEL} onSelect={(e, opt) => {onPrepSelect(e, opt)}}></Select></td>
                    <td><Select className={ingredClass} options={ingredItems} defaultValue={DEFAULT_LABEL} onSelect={(e, opt) => {onIngredSelect(e, opt)}}></Select></td>
                    <td>{numPossibilities}</td></tr>);
            } else return <tr/>;
        });

        return (<table><thead>{header}</thead><tbody>{body}</tbody></table>);
    }

    /**
     * If all the steps are guessed at, allow the guess button.
     * Otherwise, say whY not
     */
    showGuessButton(steps) {
        let missingPrep = steps.some((step) => step.prep === ATTEMPT_UNKOWN);
        let missingIngred = steps.some((step) => step.ingredient === ATTEMPT_UNKOWN);
        let msg = "PULL THE OZMATRON";
        let enabled = true;
        if (missingPrep) {
            msg = "...complete the preparations";
            enabled = false;
        } else if (missingIngred) {
            msg = "...complete the ingredients";
            enabled = false;
        }
        if (missingPrep && missingIngred) {
            msg = "...complete the guesses";
            enabled = false; 
        }
        if (enabled) {
            return <Button disabled={enabled?"":"disabled"} onClick={(e) => this.onOzInvoke()}>{msg}</Button>;
        } else {
            // ehh, just do text
            return <span>{msg}</span>
        }
    }

    onOzInvoke() {
        console.log("hello from the Ozmatron");
        let targetRecipe = this.recipes.byId(this.state.guessee);
        if (!targetRecipe) {
            return;
        }
        let attempt = this.state.attempt;
        let scores = attempt.ScoreAgainst(targetRecipe);
        console.log("scores =", scores);
        let ingredScores = scores[0];
        let prepScores = scores[1];
        this.setState({ingredScores, prepScores});
    }

    scoresDisplay() {
        if (!this.state.prepScores && !this.state.ingredScores) {
            return <div>ain't got no scores</div>
        }
        let prepText = this.state.prepScores.map((score) => Attempt.scoreToText(score)).join(',');
        let ingredText = this.state.ingredScores.map((score) => Attempt.scoreToText(score)).join(',');
        return <ul>
            <li>Scores on the preparations: {prepText}</li>
            <li>Scores on the ingredients: {ingredText}</li>
        </ul>;
    }

    showRecipeGuess(recipe) {
        let preamble = <div>You are guessing at the <b>{recipe.name}</b> recipe</div>;
        var allSteps = this.props.recipes.ExpandedSteps(recipe.recipeId);
        let intro = <div>, which has <b>{allSteps.length}</b> steps;</div>;
        let stepChoices = this.showStepChoices(allSteps);
        let guessButton = this.showGuessButton(allSteps);
        return (
            <div>
                {preamble}
                {intro}
                {stepChoices}
                {guessButton}
                {this.scoresDisplay()}

                <Button onClick={(e) => { this.setState({ guessee: 0 }) }}>Pick a different one</Button>
            </div>);
    }

    render() {
        if (this.state.guessee === 0) {
            return this.showRecipes();
        }
        let recipe = this.props.recipes.byId(this.state.guessee);
        if (!recipe) {
            return <span>uh-oh, recipe # {this.state.guessee} not found?</span>
        }
        return this.showRecipeGuess(recipe);
    }
}
export default GuessPage;
