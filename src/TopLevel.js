import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Button, Layout } from 'antd';
import GuessPage from './GuessPage';
import Ingredients from './Ingredients';
import NavMenu from './NavMenu';
import Preps from './Preps';
import Recipes from './Recipes';
import StepConfigs from './step_config';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 'none',
            spoilers: false
        }
    }
    handleShowPage(which) {
        console.log('show page', which);
        this.setState({ currentPage: which });
    }
    componentDidMount() {
        console.log('hello from didMount');
    };

    renderFollowsFrom(recipe, recipes) {
        if (!recipe || !recipe.followsFrom) {
            return "--";
        }
        let other = recipes.byId(recipe.followsFrom);
        return other ? other.name : "---";

    }

    renderSteps(recipe, stepConfigs, ingredients, preps) {
        if (!recipe || !recipe.steps || recipe.steps.length === 0) {
            return "";
        }
        let numPossiblities = 1;
        let header = <tr><th>#</th><th>Preparation</th><th>Ingredients</th></tr>;
        let body = [];
        if (recipe.followsFrom > 0) {
            body.push(<tr><td colspan="3">Start as per recipe # {recipe.followsFrom}</td></tr>);
        }
        recipe.steps.forEach((step) => {
            let prepList = [];
            let configId = step.stepConfigId;
            let configBundle = stepConfigs.byId(configId);
            let ordinality = configBundle.ordinality;
            configBundle.possiblePreps.forEach((prepId, index) => {
                let prep = preps.byId(prepId);
                let termText = "???";
                let clz = "";
                if (prep && prep.name) {
                    if (this.state.spoilers && step.prep === prepId) {
                        clz = "spoiler";
                        termText = prep.name.toUpperCase();
                    } else {
                        termText = prep.name;
                    }
                } 
                // can't use .join() because array of objects, not of strings.
                if (index > 0) {
                    termText = ", " + termText;
                }
                prepList.push(<span className={clz}>{termText}</span>);
            });
            if (configBundle.possiblePreps > 0)
            numPossiblities *= configBundle.possiblePreps;
            let ingredList = [];
            configBundle.possibleIngredients.forEach((ingredId) => {
                let ingred = ingredients.byId(ingredId);
                let term = <span>{ingredId}???</span>;
                if (ingred && ingred.name) {
                    term = (this.state.spoilers &&  step.ingredient === ingredId) ? ingred.name.toUpperCase() : ingred.name;
                }
                ingredList.push(term);
            });
            if (configBundle.possibleIngredients > 0)
            numPossiblities *= configBundle.possibleIngredients;

            body.push(<tr><td>{ordinality}</td>
            <td>{prepList}</td>
            <td>{ingredList.join()}</td></tr>);
        });
        body.push(<tr><td colspan="3">{numPossiblities} possibilities</td></tr>)

        return <table><thead>{header}</thead><tbody>{body}</tbody></table>;
    }

    dumpRecipes() {
        let recipes = new Recipes();
        let buttonPart = <Button onClick={() => this.setState({spoilers: !this.state.spoilers})}>
            {this.state.spoilers ? "hide spoilers" : " show spoilers"}</Button>;
        let header = <tr>
            <th>id</th>
            <th>name</th>
            <th>followsFrom</th>
            <th>steps</th>
        </tr>;
        let body = [];
        let ingrdients = new Ingredients();
        let preps = new Preps();
        let stepConfigs = new StepConfigs();
        recipes.Dump().forEach((recipe) => {
            body.push(<tr><td>{recipe.recipeId}</td><td>{recipe.name}</td>
            <td>{this.renderFollowsFrom(recipe, recipes)}</td>
            <td>{this.renderSteps(recipe, stepConfigs, ingrdients, preps)}</td></tr>);
        });
        return <div>{buttonPart}
        <table><thead>{header}</thead><tbody>{body}</tbody></table></div>;
    }

    dumpIngredients() {
        let dumper = new Ingredients();
        let dump = dumper.Dump();
        let inner = [];
        dump.forEach((ingredient) => {
            inner.push(<li>{ingredient.name}</li>);
        });
        return <ul>{inner}</ul>;
    }
    dumpPreps() {
        let dumper = new Preps();
        let dump = dumper.Dump();
        let inner = [];
        dump.forEach((prep) => {
            inner.push(<li>{prep.name}</li>);
        });
        return <ul>{inner}</ul>;
    }
    dumpStepConfigs() {
        let dumper = new StepConfigs();
        let ingredsConfig = new Ingredients();
        let prepConfig = new Preps();
        let dump = dumper.Dump();
        let header = [];
        header.push(<thead><tr>
            <th>Id</th><th>ordinality</th><th>poss. ingrdients</th>
            <th>poss. preps</th><th># possibilities</th>
        </tr></thead>);
        let body = [];
        dump.forEach((config) => {
            let ingreds = [];
            config.possibleIngredients.forEach((ingredId) => {
                ingreds.push(ingredsConfig.byId(ingredId).name);
            });
            let preps = [];
            config.possiblePreps.forEach((prepId) => {
                preps.push(prepConfig.byId(prepId).name);
            });
            body.push(<tr><td>{config.stepConfigId}</td>
                <td>{config.ordinality}</td>
                <td>{ingreds.join()}</td>
                <td>{preps.join()}</td>
                <td>{dumper.NumPossibilities(config)}</td>
            </tr>);
        });
        return <table>{header}<tbody>{body}</tbody></table>;
    }

    renderContent() {
        var ans = "";
        switch (this.state.currentPage) {
            case 'none':
                ans = <span>no current page</span>;
                break;
            case 'dump ingredients':
                ans = this.dumpIngredients();
                break;
            case 'dump preps':
                ans = this.dumpPreps();
                break;
            case 'dump recipes':
                ans = this.dumpRecipes();
                break;
            case 'dump step configs':
                ans = this.dumpStepConfigs();
                break;
            case 'guess':
                ans = <GuessPage />;
                break;
            default:
                ans = <div>unknown current page</div>;
                break;

        }
        return ans;
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        return (
            <Layout>
                <Header>
                    <div className="header_detail"><p>Header text</p></div>
                </Header>
                <Layout>
                    <Sider><div className="sider"><NavMenu
                        handleShowPage={(which) => this.handleShowPage(which)} /></div>
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
