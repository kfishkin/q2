import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Layout } from 'antd';
import { BaseCard } from './BaseCard';
import BEGateway from './BEGateway';
import Card from './Card';
import CashierPage from './CashierPage';
import ConfigPage from './ConfigPage';
import FightPage from './FightPage';
import GamePage from './GamePage';
import GameChoicePage from './GameChoicePage';
import LoginPage from './LoginPage';
import MerchantPage from './MerchantPage';
import Pile from './pile';
import WorkshopPage from './WorkshopPage';
import LootPage from './LootPage';
import NavMenu, { CASHIER_PAGE, LOOT_PAGE, MERCHANT_PAGE, WORKSHOP_PAGE } from './NavMenu';
import PageTemplate from './PageTemplate';
import { CONFIG_PAGE, FIGHT_PAGE, GAME_PAGE, GAME_ADMIN_PAGE, HOME_PAGE, LOGIN_PAGE } from './NavMenu';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        const beURI = process.env.REACT_APP_BE_URI || "Unknown";
        console.log(`baseURI=${beURI}`);
        let pile = new Pile();
        this.state = {
            currentPage: HOME_PAGE,
            spoilers: false,
            beURI: beURI,
            beGateway: new BEGateway(beURI, pile),
            // created later
            // playerInfo: { handle, id, playerId, displayName, deck}
            // gameInfo: { gameId, name, baseCards:dict of BaseCard }
        }
    }
    handleShowPage(which, extra) {
        console.log(`show page ${which}, extra=${extra}`);
        this.setState({ currentPage: which, extra: extra });
    }
    async componentDidMount() {
    };


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

    onUnloadCurrentGame() {
        let newPlayerData = { ...this.state.playerInfo };
        delete newPlayerData.deck;

        this.setState({ gameInfo: null, playerInfo: newPlayerData });
    }

    onLogout() {
        console.log('logging out');
        this.setState({
            playerInfo: null,
            currentPage: LOGIN_PAGE
        })
    }

    // signal that something about a room has changed on the BE, need to reload cache.

    // signal that a player's deck has changed on the BE, need to reload cache.
    onPlayerDeckBEChange() {
        let playerId = this.state.playerInfo.playerId;
        let gameId = this.state.gameInfo.gameId;
        if (!playerId || !gameId)
            return;

        console.log(`BE change for player ${playerId} in game ${gameId}`);
        this.state.beGateway.oldGetPlayerCardsForGame(gameId, playerId)
            .then((v) => {
                //console.log(`onSetCurrentGame: player deck has ${v.length} cards`);
                let newPlayerData = { ...this.state.playerInfo };
                newPlayerData.deck = v.map((card) => {
                    let obj = card;
                    return obj;
                })
                // newPlayerData.deck = [...v];
                //console.log(`new deck = ${JSON.stringify(newPlayerData.deck)}`);
                this.setState({ playerInfo: newPlayerData });
            }).catch((e) => {
                console.error(`onPlayerDeckBEChange: e=${e}`);
            });
    }

    async onGameDeckBEChange() {
        console.log(`onGameDeckBEChange: called)`);
        let gameId = this.state.gameInfo.gameId;
        let v = await this.state.beGateway.getGameInfo(gameId)
                let gameInfo = this.state.gameInfo;
                gameInfo.map = v.map;
                //console.log(`getGameInfo: v = ${v}, ${JSON.stringify(v)}`);
                this.setState({ gameInfo: gameInfo });
    }

    // mark the given room as traversable
    onPlantFlag(row, col) {
        let newGameData = this.state.gameInfo;
        let room = newGameData.map.rooms[row][col];
        // don't need to make a BE trip for this, just stamp it locally
        // to mirror what the BE has already done.
        let perPlayerInfo = ('per_player_info' in room) ? room.per_player_info
            : {
                player_id: this.state.playerInfo.playerId,
                description: 'empty',
                when: new Date()
            };
        perPlayerInfo.traversable = true;
        room.per_player_info = perPlayerInfo;
        room.title = '---';
        newGameData.map.rooms[row][col] = room; // prolly not needed
        this.setState({ gameInfo: newGameData });
    }

    // TODO: have this call an async helper function, get out of .then chaining indentation.
    onSetCurrentGame(gameId, gameName) {
        console.log(`onSetCurrentGame: set to ${gameId} (${gameName})`);
        //let newPlayerData = { ...this.state.playerInfo };
        //newPlayerData.currentGameId = gameId;
        //newPlayerData.currentGameName = gameName;
        let newGameData = { gameId: gameId, name: gameName, baseCards: null }
        this.state.beGateway.getGameInfo(gameId)
            .then((v) => {
                //console.log(`getGameInfo: v = ${v}, ${JSON.stringify(v)}`);
                newGameData.map = v.map;
                this.setState({ /*playerInfo: newPlayerData,*/ gameInfo: newGameData });
                console.log(`onSetCurrentGame: asking for game cards`);
                // as cards can point to other cards, to give meaningful description/semantics,
                // need all game cards...
                this.state.beGateway.getBaseCardsFor(gameId).then((v) => {
                    //console.log(`getGameCards(${gameId}): returned ${JSON.stringify(v)}`);
                    // base cards are hashed by id
                    let baseCards = {};
                    v.forEach((bc) => {
                        baseCards[bc._id] = BaseCard.make(bc.type, bc)
                    });

                    newGameData.baseCards = baseCards;
                    this.setState({ gameInfo: newGameData });
                    // and load the deck..
                    this.onPlayerDeckBEChange();
                }).catch((e) => {
                    console.log(`getGameInfo: e = ${e}, ${JSON.stringify(e)}`);
                })
            });
    }

    renderContent() {
        var ans = "";
        // temp until we make all the cards be Cards...
        let deckObjs = (this.state.playerInfo && this.state.playerInfo.deck) ? this.state.playerInfo.deck.map((db) => Card.Of(db)): [];
        switch (this.state.currentPage) {
            case CASHIER_PAGE:
                ans = <CashierPage beGateway={this.state.beGateway}
                    deck={this.state.playerInfo.deck} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    baseCards={this.state.gameInfo.baseCards} />
                break;
            case LOGIN_PAGE:
                ans = <LoginPage beGateway={this.state.beGateway} onLogin={(id, handle, name) => this.onLogin(id, handle, name)}
                    onLogout={() => this.onLogout()}
                    playerInfo={this.state.playerInfo}></LoginPage>;
                break;
            case CONFIG_PAGE:
                ans = <ConfigPage beGateway={this.state.beGateway}></ConfigPage>;
                break;
            case FIGHT_PAGE:
                let row = this.state.extra.row;
                let col = this.state.extra.col;
                let room = this.state.gameInfo.map.rooms[row][col];
                ans = <FightPage room={room} deck={deckObjs}
                    baseCards={this.state.gameInfo.baseCards}
                    beGateway={this.state.beGateway} 
                    row={row} col={col}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    onGameDeckBEChange={() => this.onGameDeckBEChange()}
                    showPageFunc={(which, extra) => this.handleShowPage(which, extra)}
                    />;
                break;
            case GAME_ADMIN_PAGE:
                ans = <GameChoicePage playerInfo={this.state.playerInfo} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo}
                    onSetCurrentGame={(gameId, gameName) => this.onSetCurrentGame(gameId, gameName)}
                    onUnloadCurrentGame={() => this.onUnloadCurrentGame()}>
                </GameChoicePage>
                break;
            case GAME_PAGE:
                ans = <GamePage playerInfo={this.state.playerInfo} gameInfo={this.state.gameInfo} beGateway={this.state.beGateway}
                    showPageFunc={(which, extra) => this.handleShowPage(which, extra)}
                    onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    onPlantFlag={(row, col) => this.onPlantFlag(row, col)} />
                break;
            case MERCHANT_PAGE:
                ans = <MerchantPage owner={this.state.extra.owner} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    playerInfo={this.state.playerInfo} />;
                break;
            case WORKSHOP_PAGE:
                ans = <WorkshopPage beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    baseCards={this.state.gameInfo.baseCards}
                    playerInfo={this.state.playerInfo} />;
                break;
            case LOOT_PAGE:
                ans = <LootPage owner={this.state.extra.owner} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} playerId={this.state.playerInfo.playerId} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()} />;
                break;
            case HOME_PAGE:
                ans = <div>Welcome! Pick an option on the left...</div>;
                break;
            default:
                ans = <div>unknown current page '{this.state.currentPage}'</div>;
                break;

        }
        return ans;
    }

    render() {
        const { Header, Footer, Sider, Content } = Layout;
        // make the templates for the nav menu. could/should be done in the ctor,
        // but those should be short and simple, and computers is fast.
        let loggedIn = this.state.playerInfo && this.state.playerInfo.handle;
        let haveGame = this.state.gameInfo && this.state.gameInfo.gameId;
        let haveDeck = this.state.playerInfo && this.state.playerInfo.deck;
        let pageTemplates = [
            new PageTemplate(LOGIN_PAGE, loggedIn ? "Logout" : "Login", true),
            new PageTemplate(GAME_ADMIN_PAGE, "Game Admin", loggedIn),
            new PageTemplate(GAME_PAGE, "Game", haveGame),
            new PageTemplate(WORKSHOP_PAGE, "Workshop", haveGame && haveDeck),
            new PageTemplate(CASHIER_PAGE, "Cashier", haveGame && haveDeck),
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
                        pageTemplates={pageTemplates} showPageFunc={(which, extra) => this.handleShowPage(which, extra)} /></div>
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
