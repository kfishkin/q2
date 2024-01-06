import React from 'react';

import { Button, Dropdown, Space } from 'antd';

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
    }

    showRecipes() {
        let items = [];
        const onClick = (e) => {
            console.log('e.key = ', e.key);
            this.setState({ guessee: e.key});
        };
        this.props.recipes.Dump().forEach((recipe) => {
            items.push(
                { label: recipe.name,
                key: recipe.recipeId }
            )
        });
        return <div>
            <Dropdown.Button menu={{ items, onClick}} arrow={true}>
<Space>
                <span>Pick a recipe by clicking on my dropdown</span>
                </Space>
                </Dropdown.Button>
            </div>;
    }

    render() {
        if (this.state.guessee === 0) {
            return this.showRecipes();
        }
        let recipe = this.props.recipes.byId(this.state.guessee);
        if (!recipe) {
            return <span>uh-oh, recipe # {this.state.guessee} not found?</span>
        }
        return <div><div>guess at recipe {this.state.guessee}</div>
          <Button onClick={(e) => {this.setState({guessee: 0})}}>Pick a different one</Button>
        
        </div>;
    }
}
export default GuessPage;
