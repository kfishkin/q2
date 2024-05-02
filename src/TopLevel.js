import React from 'react';
import 'antd/dist/reset.css';
import { VERSION } from './AboutPage';
import { Layout } from 'antd';
import { APP_PAGES } from './config/AppPages';
import AwayPage from './AwayPage';
import BackpackPage from './BackpackPage';
import { BaseCard } from './BaseCard';
import BEGateway from './BEGateway';
import ButtonBar from './ButtonBar';
import Card from './Card';
import CashierPage from './CashierPage';
//import ErrorBoundary from './ErrorBoundary';
import FightStartPage from './FightStartPage';
import GameChoicePage from './GameChoicePage';
import InventoryPage from './InventoryPage';
import LoginPage from './LoginPage';
import MerchantPage from './MerchantPage';
import { Merchants } from './config/Merchants';
import NewsPage from './NewsPage';
import Pile from './pile';
import { PlayerStates } from './types/PlayerStates';
import SellPage from './SellPage';
import TrophyPage from './TrophyPage';
import WorkshopPage from './WorkshopPage';
import LootPage from './LootPage';
import FightPage from './FightPage';
import CostcoPage from './CostcoPage';
import RetailPage from './RetailPage';
import StudyPage from './StudyPage';
import DistillPage from './DistillPage';


class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        const beURI = process.env.REACT_APP_BE_URI || "Unknown";
        console.log(`baseURI=${beURI}`);
        let pile = new Pile();
        this.state = {
            currentPage: APP_PAGES.LOGIN_PAGE,
            spoilers: false,
            beURI: beURI,
            beGateway: new BEGateway(beURI, pile),
            playerState: PlayerStates.UNKNOWN,
            // created later
            // playerInfo: { handle, id, playerId, displayName, deck}
            // gameInfo: { gameId, name, baseCards:dict of BaseCard }
            // playerStateBundle (home/away/fighting, and context around that)
            heartbeat: 0, // used to make kids re-render
        }
        this.intervalId = null;
    }
    handleShowPage(which, extra) {
        console.log(`show page ${which}, extra=${extra}`);
        this.setState({ currentPage: which, extra: extra });
    }

    componentDidMount() {
        //console.log(`topLevel cdm: called`);
    };

    componentWillUnmount() {

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
            currentPage: APP_PAGES.GAME_ADMIN_PAGE
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
            currentPage: APP_PAGES.LOGIN_PAGE
        })
    }

    // the deck has been changed as given. Cause re-renderings
    setPlayerDeck(newDeck) {
        let newPlayerData = { ...this.state.playerInfo };
        newPlayerData.deck = newDeck;
        this.setState({ playerInfo: newPlayerData }, () => this.setState({ heartbeat: this.state.heartbeat + 1 }));
    }

    // signal that a player's deck has changed on the BE, need to reload cache.
    async onPlayerDeckBEChange() {
        let playerId = this.state.playerInfo.playerId;
        let gameId = this.state.gameInfo.gameId;
        if (!playerId || !gameId)
            return;

        // get the awards, i don't care about them, but the BE gateway
        // can use this to stamp the new deck of cards...
        await this.state.beGateway.getAwards(gameId, playerId);
        // and get the new deck
        let newDeck = await this.state.beGateway.oldGetPlayerCardsForGame(gameId, playerId)
        this.setPlayerDeck(newDeck);
    }

    async onGameDeckBEChange() {
        let gameId = this.state.gameInfo.gameId;
        let v = await this.state.beGateway.getGameInfo(gameId)
        let gameInfo = this.state.gameInfo;
        gameInfo.board = v.board;
        //console.log(`getGameInfo: v = ${v}, ${JSON.stringify(v)}`);
        this.setState({ gameInfo: gameInfo });
    }

    async reloadAll() {
        // reload the game deck...
        await this.onGameDeckBEChange();
        // reload the player deck
        await this.onPlayerDeckBEChange();
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

    // just get the player state part
    async getPlayerState(gameId, playerId) {
        let playerStateBundle = await this.state.beGateway.getPlayerState(gameId, playerId);
        this.setState({ playerState: playerStateBundle.state, playerStateBundle: playerStateBundle });
        return playerStateBundle;
    }

    onReloadPlayerState() {
        this.getPlayerState(this.state.gameInfo.gameId, this.state.playerInfo.playerId).then((v) => {
            console.log(`reloaded player state`);
        })
    }

    onUpdatePlayerState(dict) {
        let newState = dict;
        this.state.beGateway.setPlayerState(this.state.gameInfo.gameId, this.state.playerInfo.playerId, newState).then((v) => {
            console.log(`onUpdatePlayerState: v = ${JSON.stringify(v)}`);
            this.setState({ playerState: parseInt(v.player_state_bundle.state), playerStateBundle: v.player_state_bundle });
        });
    }

    // on setting current game, call a chain of async functions to get all state.
    // returns that as a dict for caller to setState() on.
    async getGameData(playerId, gameId) {
        let playerStateBundle = await this.getPlayerState(gameId, playerId);
        console.log(`playerState = ${JSON.stringify(playerStateBundle)}`);
        let playerState = playerStateBundle.state;
        console.log(`playerState = ${playerState}`);
        let gameInfo = await this.state.beGateway.getGameInfo(gameId);
        let board = gameInfo.board;
        //console.log(`map = ${JSON.stringify(map)}`);
        let rawBaseCards = await this.state.beGateway.getBaseCardsFor(gameId);
        //console.log(`rawBaseCards = ${JSON.stringify(rawBaseCards)}`);
        return { playerState: playerStateBundle.state, board, rawBaseCards };
    }

    onSetCurrentGame(gameId, gameName) {
        console.log(`onSetCurrentGame: set to ${gameId} (${gameName})`);
        let playerId = this.state.playerInfo.playerId;
        this.getGameData(playerId, gameId).then((v) => {
            console.log(`getGameData: v = ${v}`);
            let newGameData = {
                gameId: gameId, name: gameName,
                board: v.board,
            };
            let baseCards = {};
            v.rawBaseCards.forEach((bc) => {
                baseCards[bc._id] = BaseCard.make(bc.type, bc)
            });
            newGameData.baseCards = baseCards;
            let page;
            switch (v.playerState) {
                case PlayerStates.AWAY: page = APP_PAGES.AWAY_PAGE; break;
                case PlayerStates.DEAD: page = APP_PAGES.TROPHY_PAGE; break;
                case PlayerStates.FIGHT_START: page = APP_PAGES.FIGHT_START_PAGE; break;
                case PlayerStates.FIGHTING: page = APP_PAGES.FIGHT_PAGE; break;
                case PlayerStates.HOME: page = APP_PAGES.HOME_PAGE; break;
                default: page = APP_PAGES.GAME_ADMIN_PAGE; break;
            }
            this.setState({ gameInfo: newGameData, currentPage: page, playerState: v.playerState }, () => { this.onPlayerDeckBEChange(); });
        });
    }

    renderContent() {
        var content = "";
        // temp until we make all the cards be Cards...
        let deckObjs = (this.state.playerInfo && this.state.playerInfo.deck) ? this.state.playerInfo.deck.map((db) => Card.Of(db)) : [];
        let loggedIn = this.state.playerInfo && this.state.playerInfo.handle;
        /* TODO: put back in to new playerState framework
        let isDead = false; // only true if we _know_ you're dead
        if (this.state.playerInfo && this.state.playerInfo.deck) {
            isDead = !this.state.playerInfo.deck.some((cdb) => {
                return (cdb.game_card.lives > 0);
            });
        }
        */
        let haveGame = this.state.gameInfo && this.state.gameInfo.gameId;
        let showButtonBar = loggedIn && haveGame;
        let playerState = this.state.playerState;
        let page = (this.state.currentPage === undefined) ? APP_PAGES.GAME_ADMIN_PAGE : this.state.currentPage;
        let room = undefined;
        if (this.state.playerStateBundle && this.state.gameInfo) {

            let affinity = this.state.playerStateBundle.affinity;
            let ordinality = this.state.playerStateBundle.ordinality;

            if (affinity !== undefined && ordinality !== undefined) {
                // find the zone for this affinity...
                let board = this.state.gameInfo.board;
                let zone = board.zones.find((zone) => zone.affinity === affinity);
                room = zone.rooms.find((room) => room.ordinality === ordinality);
            }
        }


        switch (page) {
            case APP_PAGES.CASHIER_PAGE:
                content = <CashierPage beGateway={this.state.beGateway}
                    deck={this.state.playerInfo.deck} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    baseCards={this.state.gameInfo.baseCards} />
                break;
            case APP_PAGES.COSTCO_PAGE:
                content = <CostcoPage
                    baseCards={this.state.gameInfo.baseCards}
                    beGateway={this.state.beGateway}
                    deck={deckObjs}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    showPageFunc={(which, extra) => this.handleShowPage(which, extra)}
                />
                break;
                case APP_PAGES.DISTILL_PAGE:
                    content = <DistillPage
                        baseCards={this.state.gameInfo.baseCards}
                        beGateway={this.state.beGateway}
                        deck={deckObjs}
                        gameId={this.state.gameInfo.gameId}
                        playerId={this.state.playerInfo.playerId}
                        onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    />
                    break;                
            case APP_PAGES.LOGIN_PAGE:
                content = <LoginPage beGateway={this.state.beGateway} onLogin={(id, handle, name) => this.onLogin(id, handle, name)}
                    onLogout={() => this.onLogout()}
                    playerInfo={this.state.playerInfo}></LoginPage>;
                break;
            case APP_PAGES.FIGHT_PAGE:
                content = <FightPage
                    baseCards={this.state.gameInfo.baseCards}
                    beGateway={this.state.beGateway}
                    deck={deckObjs}
                    gameId={this.state.gameInfo.gameId}
                    onDie={() => this.onDie()}
                    onFlee={() => this.onFlee()}
                    playerId={this.state.playerInfo.playerId}
                    playerStateBundle={this.state.playerStateBundle}
                    room={room}
                    onWon={() => this.onWonBattle()}
                />;
                break;
            case APP_PAGES.FIGHT_START_PAGE:
                content = <FightStartPage
                    beGateway={this.state.beGateway}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    baseCards={this.state.gameInfo.baseCards}
                    playerStateBundle={this.state.playerStateBundle}
                    room={room}
                    onUpdatePlayerState={(dict) => this.onUpdatePlayerState(dict)}
                    deck={deckObjs} />
                break;
            case APP_PAGES.GAME_ADMIN_PAGE:
                content = <GameChoicePage playerInfo={this.state.playerInfo} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo}
                    onSetCurrentGame={(gameId, gameName) => this.onSetCurrentGame(gameId, gameName)}
                    onUnloadCurrentGame={() => this.onUnloadCurrentGame()}>
                </GameChoicePage>
                break;
            case APP_PAGES.INVENTORY_PAGE:
                content = <InventoryPage playerInfo={this.state.playerInfo} gameInfo={this.state.gameInfo} beGateway={this.state.beGateway}
                    baseCards={this.state.gameInfo.baseCards}
                    deck={deckObjs} />;
                break;
            case APP_PAGES.MERCHANT_PAGE:
                content = <MerchantPage action={this.state.extra.merchant} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    playerInfo={this.state.playerInfo} />;
                break;
            case APP_PAGES.REPAIR_PAGE:
                content = <MerchantPage merchant={Merchants.BLACKSMITH} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    playerInfo={this.state.playerInfo} />;
                break;
            case APP_PAGES.RETAIL_PAGE:
                content = <RetailPage
                    baseCards={this.state.gameInfo.baseCards}
                    beGateway={this.state.beGateway}
                    deck={deckObjs}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    onBought={() => this.reloadAll()}
                />
                break;
            case APP_PAGES.SEER_PAGE:
                content = <MerchantPage merchant={Merchants.SEER} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    playerInfo={this.state.playerInfo} />;
                break;
            case APP_PAGES.SELL_PAGE:
                content = <SellPage
                    baseCards={this.state.gameInfo.baseCards}
                    beGateway={this.state.beGateway}
                    deck={deckObjs}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    onSold={() => this.reloadAll()}
                />
                break;
            case APP_PAGES.STUDY_PAGE:
                content = <StudyPage
                    beGateway={this.state.beGateway}
                    deck={deckObjs}
                    gameId={this.state.gameInfo.gameId}
                    onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    playerId={this.state.playerInfo.playerId}
                />
                break;
            case APP_PAGES.TROPHY_PAGE:
                content = <TrophyPage beGateway={this.state.beGateway}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId} />
                break;
            case APP_PAGES.WORKSHOP_PAGE:
                content = <WorkshopPage beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
                    baseCards={this.state.gameInfo.baseCards}
                    heartbeat={this.state.heartbeat}
                    playerInfo={this.state.playerInfo} />;
                break;
            case APP_PAGES.LOOT_PAGE:
                content = <LootPage owner={this.state.extra.owner} beGateway={this.state.beGateway}
                    gameInfo={this.state.gameInfo} playerId={this.state.playerInfo.playerId} onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()} />;
                break;
            case APP_PAGES.HOME_PAGE:
                content = <div>There's no place like home.</div>;
                break;
            case APP_PAGES.NEWS_PAGE:
                content = <NewsPage beGateway={this.state.beGateway}
                    gameId={this.state.gameInfo.gameId} baseCards={this.state.gameInfo.baseCards} playerId={this.state.playerInfo.playerId} />;
                break;
            case APP_PAGES.AWAY_PAGE:
                content = <AwayPage
                    beGateway={this.state.beGateway}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    baseCards={this.state.gameInfo.baseCards}
                    board={this.state.gameInfo.board}
                    showPageFunc={(which, extra) => this.handleShowPage(which, extra)}
                    onReloadPlayerState={() => this.onReloadPlayerState()}
                    deck={deckObjs} />
                break;
            case APP_PAGES.BACKPACK_PAGE:
                content = <BackpackPage
                    beGateway={this.state.beGateway}
                    gameId={this.state.gameInfo.gameId}
                    playerId={this.state.playerInfo.playerId}
                    baseCards={this.state.gameInfo.baseCards}
                    deck={deckObjs}
                    setPlayerDeck={(deck) => this.setPlayerDeck(deck)}
                    playerState={playerState} />
                break;
            default:
                content = <div>unknown current page '{this.state.currentPage}'</div>;
                break;

        }
        if (showButtonBar) {
            content = [<ButtonBar playerState={this.state.playerState} playerName={this.state.playerInfo.displayName}
                beGateway={this.state.beGateway}
                gameId={this.state.gameInfo.gameId} playerId={this.state.playerInfo.playerId}
                gotoMerchant={(which) => this.handleShowPage(this.APP_PAGES.MERCHANT_PAGE, { merchant: which })}
                startAdventureFunc={() => this.startAdventure()}
                endAdventureFunc={() => this.endAdventure()}
                onRedraw={() => this.onRedraw()}
                onFlee={() => this.onFlee()}
                onStartFighting={() => this.onStartFighting()}
                showPageFunc={(which, extra) => this.handleShowPage(which, extra)} />,
                content];
        }

        return content;
    }

    onRedraw() {
        this.setState({ heartbeat: this.state.heartbeat + 1 });
    }

    onWonBattle() {
        // ask BE for new state, and redirect.
        this.reloadAll().then((v) => {
            let bundle = this.state.playerStateBundle;
            bundle.state = PlayerStates.AWAY;
            this.setState({ playerState: PlayerStates.AWAY, playerStateBundle: bundle }, () => this.handleShowPage(APP_PAGES.AWAY_PAGE, {}));
        });
    }

    onDie() {
        // ask BE for new state, and redirect.
        this.reloadAll().then((v) => {
            let bundle = this.state.playerStateBundle;
            bundle.state = PlayerStates.DEAD;
            this.setState({ playerState: PlayerStates.DEAD, playerStateBundle: bundle }, () => this.handleShowPage(APP_PAGES.TROPHY_PAGE, {}));
        });
    }

    onFlee() {
        // lotsa stuff happens, do it all on the BE and then wait...
        console.log(`flee: called`);
        this.state.beGateway.flee(this.state.gameInfo.gameId, this.state.playerInfo.playerId).then((v) => {
            // load the new gameInfo - lots may have changed.
            this.reloadAll().then((v) => {
                console.log(`top.flee: v = ${v}`);
                let bundle = this.state.playerStateBundle;
                bundle.state = PlayerStates.HOME;
                this.setState({ playerState: PlayerStates.HOME, playerStateBundle: bundle }, () => this.handleShowPage(APP_PAGES.HOME_PAGE, {}));
            });
        }).catch((e) => console.log(`flee: e=${e}`));
    }

    endAdventure() {
        // lotsa stuff happens, do it all on the BE and then wait...
        console.log(`endAdventure: called`);
        this.state.beGateway.goHome(this.state.gameInfo.gameId, this.state.playerInfo.playerId).then((v) => {
            // load the new gameInfo - lots may have changed.
            this.reloadAll().then((v) => {
                console.log(`top.goHome: v = ${v}`);
                let bundle = this.state.playerStateBundle;
                bundle.state = PlayerStates.HOME;
                this.setState({ playerState: PlayerStates.HOME, playerStateBundle: bundle }, () => this.handleShowPage(APP_PAGES.HOME_PAGE, {}));
            });
        }).catch((e) => console.log(`flee: e=${e}`));
    }

    onStartFighting() {
        console.log(`onStartFight: called`);
        // change state, and then go to the fight page...
        // signal the BE, and wait...
        let newState = { state: PlayerStates.FIGHTING };
        this.state.beGateway.setPlayerState(this.state.gameInfo.gameId, this.state.playerInfo.playerId, newState).then((v) => {
            console.log(`top.startAdventure: v = ${v}`);
            let newPage = APP_PAGES.FIGHT_PAGE;
            this.setState({ playerState: parseInt(v.player_state_bundle.state) }, () => this.handleShowPage(newPage, {}));
        }).catch((e) => console.log(`startAdventure: e=${e}`));
    }

    startAdventure() {
        console.log(`start Adventure: called`);
        // signal the BE, and wait...
        let newState = { state: PlayerStates.AWAY };
        this.state.beGateway.setPlayerState(this.state.gameInfo.gameId, this.state.playerInfo.playerId, newState).then((v) => {
            console.log(`top.startAdventure: v = ${v}`);
            let newPage = APP_PAGES.AWAY_PAGE;
            this.setState({ playerState: parseInt(v.player_state_bundle.state) }, () => this.handleShowPage(newPage, {}));
        }).catch((e) => console.log(`startAdventure: e=${e}`));
    }

    render() {
        const { Header, Footer, Content } = Layout;
        // make the templates for the nav menu. could/should be done in the ctor,
        // but those should be short and simple, and computers is fast.
        let loggedIn = this.state.playerInfo && this.state.playerInfo.handle;
        let haveGame = this.state.gameInfo && this.state.gameInfo.gameId;
        let haveDeck = this.state.playerInfo && this.state.playerInfo.deck;
        let isDead = false; // only true if we _know_ you're dead
        if (this.state.playerInfo && this.state.playerInfo.deck) {
            isDead = !this.state.playerInfo.deck.some((cdb) => {
                return (cdb.game_card.lives > 0);
            });
        }
        if (isDead) {
            console.log(`you are dead`);
        }
        let fighting = (APP_PAGES.FIGHT_PAGE === this.state.currentPage);

        console.log(`current page = [${this.state.currentPage}]`);
        let headerText = loggedIn ? `Welcome, ${this.state.playerInfo.displayName}` : "Please log in to start";

        let commonProps = {
            loggedIn, haveGame, haveDeck, fighting, isDead
        };
        commonProps.showPageFunc = (which, extra) => this.handleShowPage(which, extra);

        return (
            <Layout>
                <Header>
                    <div className="header_detail"><p>{headerText}</p></div>
                </Header>
                <Layout>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Q2 version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
