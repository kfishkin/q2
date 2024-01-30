import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Layout } from 'antd';
import BEGateway from './BEGateway';
import { CardType } from './CardType';
import ConfigPage from './ConfigPage';
import GamePage from './GamePage';
import GameChoicePage from './GameChoicePage';
import LoginPage from './LoginPage';
import NavMenu from './NavMenu';
import PageTemplate from './PageTemplate';
import { CONFIG_PAGE, GAME_PAGE, GAME_ADMIN_PAGE, HOME_PAGE, LOGIN_PAGE } from './NavMenu';


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

    onLogin(id, handle, name) {
        console.log(`logged in with id ${id}, handle ${handle}, name ${name}`);
        this.setState({
            playerInfo: {
                handle: handle,
                id: id,
                playerId: id,
                displayName: name
            },
            currentPage: GAME_ADMIN_PAGE
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

    onSetCurrentGame(gameId, gameName) {
        console.log(`onSetCurrentGame: set to ${gameId} (${gameName})`);
        let newPlayerData = {...this.state.playerInfo};
        newPlayerData.currentGameId = gameId;
        newPlayerData.currentGameName = gameName;
        this.setState({playerInfo: newPlayerData});
        console.log(`onSetCurrentGame: asking for player cards`);

        // TODO: should/could do this in the DB, not here.
        this.state.beGateway.getCardsForGame(gameId, this.state.playerInfo.playerId)
          .then((v) => {
            console.log(`onSetCurrentGame: player deck = ${JSON.stringify(v)}`);
            newPlayerData.deck = v.map((card) => {
                let obj = card;
                obj.game_card.type = CardType.make(card.game_card);
                console.log(`game card type = ${JSON.stringify(obj.game_card.type)}`);
                return obj;
            })
            // newPlayerData.deck = [...v];
            //console.log(`new deck = ${JSON.stringify(newPlayerData.deck)}`);
            this.setState({playerInfo: newPlayerData});
          }).catch((e) => {
            console.log(`onSetCurrentGame: e=${e}`);
          });

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
            case GAME_ADMIN_PAGE:
                ans = <GameChoicePage playerInfo={this.state.playerInfo} beGateway={this.state.beGateway}
                onCreateGame={(id,name) => this.onCreateGame(id, name)}
                onSetCurrentGame={(gameId, gameName) => this.onSetCurrentGame(gameId, gameName)}></GameChoicePage>
                break;
                case GAME_PAGE:
                    ans = <GamePage playerInfo={this.state.playerInfo} beGateway={this.state.beGateway}/>
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
        let loggedIn = this.state.playerInfo && this.state.playerInfo.handle;
        let pageTemplates = [
        new PageTemplate(LOGIN_PAGE, loggedIn ? "Logout": "Login", true),
        new PageTemplate(GAME_ADMIN_PAGE, "Game Admin", loggedIn),
        new PageTemplate(GAME_PAGE, "Game", this.state.playerInfo && this.state.playerInfo.currentGameId),
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
