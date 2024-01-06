import React from 'react';
import StepConfigs from './step_config';
import { Button, Dropdown, Select, Space } from 'antd';
import Preps from './Preps';
import Ingredients from './Ingredients';

class GuessPage extends React.Component {
    /*
    * props:
    * recipes = the (Recipes) object
    */
    constructor(props) {
        super(props);
        console.log('recipes =', props.recipes);
        this.state = {
            guessee: 0 // the recipe being guessed at. 0 = undef.
        }
        this.stepConfigs = new StepConfigs();
        this.allPreps = new Preps();
        this.allIngredients = new Ingredients();
    }

    showRecipes() {
        let items = [];
        const onClick = (e) => {
            console.log('e.key = ', e.key);
            this.setState({ guessee: e.key });
        };
        this.props.recipes.Dump().forEach((recipe) => {
            items.push(
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
        let body = [];
        let numPossibilities = 1;
        let onPrepSelect = function(e, opt) {
            console.log('on prep select', e, opt);
        }
        let onIngredSelect = function(e, opt) {
            console.log('on ingred select select', e, opt);
        }
        steps.forEach((step, index) => {
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
                        value: 0
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
                        value: 0
                    }
                )
                numPossibilities *= stepConfig.possibleIngredients.length;
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
                body.push(<tr><td>{stepNum + 1}</td>
                    <td><Select options={prepItems} defaultValue={DEFAULT_LABEL} onSelect={(e, opt) => {onPrepSelect(e, opt)}}></Select></td>
                    <td><Select options={ingredItems} defaultValue={DEFAULT_LABEL} onSelect={(e, opt) => {onIngredSelect(e, opt)}}></Select></td>
                    <td>{numPossibilities}</td></tr>);
            }
        });
        return (<table><thead>{header}</thead><tbody>{body}</tbody></table>);
    }

    showRecipeGuess(recipe) {
        let preamble = <div>You are guessing at the <b>{recipe.name}</b> recipe</div>;
        var allSteps = this.props.recipes.ExpandedSteps(recipe.recipeId);
        let intro = <div>, which has <b>{allSteps.length}</b> steps;</div>;
        let stepChoices = this.showStepChoices(allSteps);
        return (
            <div>
                {preamble}
                {intro}
                {stepChoices}

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
