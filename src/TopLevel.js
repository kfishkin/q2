import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Button, Layout } from 'antd';
import BEGateway from './BEGateway';
import ConfigPage from './ConfigPage';
import GamePage from './GamePage';
import Ingredients from './Ingredients';
import LoginPage from './LoginPage';
import NavMenu from './NavMenu';
import Preps from './Preps';
import StepConfigs from './step_config';
import PageTemplate from './PageTemplate';
import { CONFIG_PAGE, GAME_PAGE, HOME_PAGE, LOGIN_PAGE } from './NavMenu';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        const beURI = process.env.REACT_APP_BE_URI || "Unknown";
        console.log(`baseURI=${beURI}`);
        this.state = {
            currentPage: HOME_PAGE,
            spoilers: false,
            beURI: beURI,
            beGateway: new BEGateway(beURI),
            heartbeat: false

            // beFetch: fetch('https://jsonplaceholder.typicode.com/todos/1')
        }
    }
    handleShowPage(which) {
        console.log(`show page ${which}`);
        this.setState({ currentPage: which });
    }
    async componentDidMount() {
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
            let configId = step.stepConfigId;
            let configBundle = stepConfigs.byId(configId);
            let ordinality = configBundle.ordinality;
            let prepList = configBundle.possiblePreps.map((prepId, index) => {
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
                return (<span className={clz}>{termText}</span>);
            });
            if (configBundle.possiblePreps > 0)
            numPossiblities *= configBundle.possiblePreps;
            let ingredList = configBundle.possibleIngredients.map((ingredId) => {
                let ingred = ingredients.byId(ingredId);
                let term = <span>{ingredId}???</span>;
                if (ingred && ingred.name) {
                    term = (this.state.spoilers &&  step.ingredient === ingredId) ? ingred.name.toUpperCase() : ingred.name;
                }
                return term;
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

    dumpRecipes(recipes) {
        let buttonPart = <Button onClick={() => this.setState({spoilers: !this.state.spoilers})}>
            {this.state.spoilers ? "hide spoilers" : " show spoilers"}</Button>;
        let header = <tr>
            <th>id</th>
            <th>name</th>
            <th>followsFrom</th>
            <th>steps</th>
        </tr>;
        let ingrdients = new Ingredients();
        let preps = new Preps();
        let stepConfigs = new StepConfigs();
        let body  = recipes.Dump().map((recipe) => {
            return (<tr><td>{recipe.recipeId}</td><td>{recipe.name}</td>
            <td>{this.renderFollowsFrom(recipe, recipes)}</td>
            <td>{this.renderSteps(recipe, stepConfigs, ingrdients, preps)}</td></tr>);
        });
        return <div>{buttonPart}
        <table><thead>{header}</thead><tbody>{body}</tbody></table></div>;
    }

    dumpIngredients() {
        let dumper = new Ingredients();
        let dump = dumper.Dump();
        let inner = dump.map((ingredient) => {
            return (<li>{ingredient.name}</li>);
        });
        return <ul>{inner}</ul>;
    }
    dumpPreps() {
        let dumper = new Preps();
        let dump = dumper.Dump();
        let inner = dump.map((prep) => {
            return (<li>{prep.name}</li>);
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
        let body = dump.map((config) => {
            let ingreds = config.possibleIngredients.map((ingredId) => {
                return (ingredsConfig.byId(ingredId).name);
            });
            let preps = config.possiblePreps.map((prepId) => {
                return (prepConfig.byId(prepId).name);
            });
           return (<tr><td>{config.stepConfigId}</td>
                <td>{config.ordinality}</td>
                <td>{ingreds.join()}</td>
                <td>{preps.join()}</td>
                <td>{dumper.NumPossibilities(config)}</td>
            </tr>);
        });
        return <table>{header}<tbody>{body}</tbody></table>;
    }

    onLogin(id, handle, name) {
        console.log(`logged in with id ${id}, handle ${handle}, name ${name}`);
        this.setState({
            playerInfo: {
                handle: handle,
                id: id,
                playerId: id,
                displayName: name
            },
            currentPage: GAME_PAGE
        })
    }

    onLogout() {
        console.log('logging out');
        this.setState({
            playerInfo: null,
            currentPage: LOGIN_PAGE
        })
    }

    onCreateGame(gameId, name) {
        console.log(`onCreateGame: gameId = [${gameId}], name = [${name}]`);
        /*
        var newInfo = { ...this.state.playerInfo};
        newInfo.gameId = gameId;
        this.setState({playerInfo: newInfo});
        */
    }

    renderContent() {
        var ans = "";
        switch (this.state.currentPage) {
            case LOGIN_PAGE:
                ans = <LoginPage beGateway={this.state.beGateway} onLogin={(id, handle,name) => this.onLogin(id, handle, name)}
                  onLogout={() => this.onLogout()}
                  playerInfo={this.state.playerInfo}></LoginPage>; 
                break;
            case CONFIG_PAGE:
                ans = <ConfigPage beGateway={this.state.beGateway}></ConfigPage>;
                break;
            case GAME_PAGE:
                ans = <GamePage playerInfo={this.state.playerInfo} beGateway={this.state.beGateway}
                onCreateGame={(id,name) => this.onCreateGame(id, name)}></GamePage>
                break;
            case HOME_PAGE:
                ans = <div>Welcome to Q2! Pick an option on the left...</div>;
                break;
            default:
                ans = <div>unknown current page '{this.state.currentPage}'</div>;
                break;

        }
        return ans;
    }

    onNewStates(dict) {
        console.log(`onNewStates: ${JSON.stringify(dict)}`);
        this.setState(dict);
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        // make the templates for the nav menu. could/should be done in the ctor,
        // but those should be short and simple, and computers is fast.
        //import { CONFIG_PAGE, CRAFT_PAGE, GAME_PAGE, LOGIN_PAGE } from './NavMenu';
        let loggedIn = this.state.playerInfo && this.state.playerInfo.handle;
        let pageTemplates = [
        new PageTemplate(LOGIN_PAGE, loggedIn ? "Logout": "Login", true),
        new PageTemplate(GAME_PAGE, "Game", loggedIn),
        new PageTemplate(CONFIG_PAGE, "Config", true)
        ]

        console.log(`current page = [${this.state.currentPage}]`);
       let headerText = loggedIn ? `Welcome, ${this.state.playerInfo.displayName}` : "Please log in to start";

        return (
            <Layout>
                <Header>
                    <div className="header_detail"><p>{headerText}</p></div>
                </Header>
                <Layout>
                    <Sider><div className="sider"><NavMenu
                        pageTemplates={pageTemplates} showPageFunc={(which) => this.handleShowPage(which)} /></div>
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
