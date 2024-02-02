import React from 'react';
import dayjs from 'dayjs';
import { Table } from 'antd';
import StatusMessage from './StatusMessage';
var localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat);


// props:
// playerInfo - dict from top level.
// beGateway - BE gateway
// onCreateGame - f(id,name) callback when a new game is created.
// onSetCurrentGame - f(gameId, gameName)
// gameInfo

class GameChoicePage extends React.Component {
  BEFORE = 0;
  DURING = 1;
  AFTER = 2;

  constructor(props) {
    super(props);
    this.state = {
      beGateway: props.beGateway,
      gameNameSuggestion: "",
      gameInfo: props.gameInfo,
      statusMessage: null,
      statusType: null,
      playerGames: null
    }
    this.loadingState = this.BEFORE;
  }

  askForNewGameName() {
    this.props.beGateway.suggestGameName()
      .then((v) => {
        this.setState({ gameNameSuggestion: v });
      })
      .catch((e) => { console.errpr("error on get suggestion: ", e) });
  }

  createNewGameUI(playerInfo) {
    const INPUT_ID = "gameName";
    const component = this;
    if (!this.state.gameNameSuggestion) {
      this.askForNewGameName();
    }
    const suggestion = this.state.gameNameSuggestion;
    // couldn't get Ant <Input> or <Form> to work properly, do it at the lower level...
    let inputValue = suggestion;
    const onChange = (e) => {
      inputValue = e.currentTarget.value;
    }
    const onSubmit = (e) => {
      if (!inputValue) return;
      this.setState({statusMessage: 'creating game', statusType: 'info'});
      component.state.beGateway.createGame(inputValue, playerInfo.playerId)
        .then((v) => {
          let gameData = v[0];
          //console.log('onSubmit.createGame.then, v=', JSON.stringify(v));
          // a failed game creation comes back as an empty object.
          if (!gameData.name) {
            component.setState({
              statusMessage: `failed game creation for ${inputValue}`,
              statusType: "error"
            });
          } else {
            // add the new game into the array....
            let oldGames = (this.state.playerGames === null) ? [] : this.state.playerGames;
            let newGames = oldGames.concat([gameData]);
            component.setState({
              statusMessage: "game created.",
              statusType: "success",
              playerGames: newGames
            });
            //component.props.onCreateGame(v._id, v.name);
          }
        })

        .catch((e) => {
          // happens on fail
          component.setState({
            statusMessage: `failed create-game for ${inputValue}`,
            statusType: "error"
          });
        });

    }

    let elt = document.getElementById(INPUT_ID);
    if (elt) {
      //doing the below on an Ant <Input> or <Form> doesn't work,
      // must do setFieldValues on the form object, which I ain't got.
      elt.value = suggestion;
    }



    return (
      <div>Or you can create a new one...
        <br />
        Game name:&nbsp;&nbsp;
        <input id={INPUT_ID} type="text" reqired="required"
          onChange={(e) => onChange(e)}
        ></input>
        <button type="button">
          <img width="16" src="pix/general/reroll.png" title="suggest one" alt="suggest one"
            onClick={(e) => component.askForNewGameName(e)}></img>
        </button>
        <button type="submit" onClick={(e) => onSubmit(e)}>Submit</button>
        <span>{this.state.debugMessage}</span>
      </div>

    );
  }

  existingGamesUI() {
    if (this.state.playerGames === null) {
      switch (this.loadingState) {
        case this.BEFORE:
          this.loadingState = this.DURING;
          this.state.beGateway.getGamesFor(this.props.playerInfo.playerId)
            .then((v) => {
              this.loadingState = this.AFTER;
              this.setState({ playerGames: v, statusMessage: 'displaying current games', statusType: 'info' });

            }).catch((e) => {
              this.loadingState = this.AFTER;
              this.setState({ statusMessage: `failure asking for current games ${e}`, statusType: 'error' });
            });
          this.setState({ statusMessage: "asking for current games...", statusType: 'info' });
          break;
        case this.DURING:
          break;
        case this.AFTER:
          break;
        default:
          break;
      }
      return "";
    } else {
      const columns = [
        {
          title: 'name', dataIndex: 'name',
          sorter: (row1, row2) => {
            return row1.name.localeCompare(row2.name)
          }
        },
        {
          title: 'created', dataIndex: 'createdAt',
          sorter: (row1, row2) => row1.createdAtUnix - row2.createdAtUnix
        },
        {
          title: 'updated', dataIndex: 'updatedAt',
          sorter: (row1, row2) => row1.updatedAtUnix - row2.updatedAtUnix
        },
        { title: 'actions', dataIndex: 'actions' }
      ];
      let onLoad = (e, gameId, gameName) => {
        console.log(`onLoad: gameId=${gameId}, gameName=${gameName}`);
        this.setState({ statusMessage: "loading..." , statusType: 'info'});
        this.props.beGateway.setPlayerCurrentGame(this.props.playerInfo.playerId, gameId)
          .then((v) => {
            console.log('onLoad: v=', v);
            this.setState({ statusMessage: "current game set" , statusType: 'success'});
            this.props.onSetCurrentGame(gameId, gameName);
          }).catch((e) => {
            console.errpr("onLoad, e=", e);
            this.setState({ statusMessage: `couldn't set current game, ${e}`, statusType: 'error' });
          })
      }
      let onDelete = (e, gameId) => {
        console.log(`onDelete: e=${e}, gameId=${gameId}`);
        if (window.confirm(`Are you sure you want to delete game ${gameId}? Can't be undone`)) {
          console.log("yes, you are sure");
          this.setState({ statusMessage: "deleting..." , statusType: 'info'});
          this.props.beGateway.deleteGame(gameId)
            .then((v) => {
              console.log(`v from delete game = ${v}`);
              this.loadingState = this.BEFORE;
              this.setState({ statusMessage: "game deleted", playerGames: null, statusType: 'error'});
            }).catch((e) => {
              console.errpr(`e from delete game ${e}`);
              this.setState({ statusMessage: "couldn't delete the game, sorry" , statusType: "error"});
            });
        }
      }
      let currentGameId = this.state.gameInfo ? this.state.gameInfo.gameId : "";
      console.log(`currentGameId = ${currentGameId}`);


      let antInnards = this.state.playerGames.map((game, i) => {
        let isCurrent = game.gameId === currentGameId;
        let gameName = game.name;
        console.log(`gameName = ${gameName}`);
        return {
          key: 'tr_' + i,
          name: game.name,
          isCurrent: isCurrent,
          createdAt: dayjs(game.createdAt).format("LLL"),
          createdAtUnix: dayjs(game.createdAt).unix(),
          updatedAt: dayjs(game.updatedAt).format("LLL"),
          updatedAtUnix: dayjs(game.updatedAt).unix(),
          actions: (<span>
            {(isCurrent) ? "" : (<button gameid={game._id} onClick={(e) => onLoad(e, game._id, gameName)}>Load</button>)}
            {(isCurrent) ? "" : (<button gameid={game._id} onClick={(e) => onDelete(e, game._id)}>Delete</button>)}</span>)
        };
      });
      let preamble = <span>You have created {this.state.playerGames.length} games.</span>;
      return <div>
        <span>{preamble}</span>
        <span>The current game looks&nbsp;</span><span current="current">like this</span>
        <Table id="games_table" columns={columns} dataSource={antInnards}
          onRow={(row) => (row.isCurrent ? { current: "current" } : {})} />
        {this.createNewGameUI(this.props.playerInfo)}
      </div>
    }
  }

  render() {
    let playerInfo = this.props.playerInfo;

    if (!playerInfo || !playerInfo.handle) {
      return <div>No game yet, you are not logged in</div>
    }
    return (
      <div>
        {this.existingGamesUI()}
        <StatusMessage message={this.state.statusMessage} type={this.state.statusType}/>
      </div>
    )
  }
}

export default GameChoicePage;