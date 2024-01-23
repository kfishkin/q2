import React from 'react';
import dayjs from 'dayjs';
import { Table } from 'antd';
var localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat);

// props:
// playerInfo - dict from top level.
// beGateway - BE gateway
// onCreateGame - f(id,name) callback when a new game is created.

class GamePage extends React.Component {
  BEFORE = 0;
  DURING = 1;
  AFTER = 2;

  constructor(props) {
    super(props);
    this.state = {
      beGateway: props.beGateway,
      gameNameSuggestion: "",
      gameInfo: null,
      statusMessage: null,
      playerGames: null
    }
    this.loadingState = this.BEFORE;
  }

  askForNewGameName() {
    this.props.beGateway.suggestGameName()
      .then((v) => {
        this.setState({ gameNameSuggestion: v });
      })
      .catch((e) => { console.log("error on get suggestion: ", e) });
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
      component.state.beGateway.createGame(inputValue, playerInfo.playerId)
        .then((v) => {
          console.log('onSubmit.createGame.then, v=', JSON.stringify(v));
          // a failed game creation comes back as an empty object.
          if (!v.name) {
            component.setState({
              statusMessage: `failed game creation for ${inputValue}`
            });
          } else {
            // add the new game into the array....
            let oldGames = (this.state.playerGames === null) ? [] : this.state.playerGames;
            let newGames = oldGames.concat([v]);
            component.setState({
              statusMessage: "game created.",
              playerGames: newGames
            });
            //component.props.onCreateGame(v._id, v.name);
          }
        })

        .catch((e) => {
          // happens on fail
          component.setState({
            statusMessage: `failed create-game for ${inputValue}`
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
      <div>Hello {playerInfo.displayName}. You have no game going, would you like to create one?
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

  dumpGameUI(playerInfo) {
    if (!this.state.gameInfo) {
      if (!this.loading) {
        this.loading = true;
        this.state.beGateway.getGameInfo(playerInfo.gameId)
          .then((v) => {
            console.log(`dumpGameUI: v = ${v}`);
            let gameInfo = { ...v };
            gameInfo.gameId = v._id;
            this.setState({ gameInfo: gameInfo });
          })
          .catch((e) => {
            console.log(`dumpGameUI: e = ${e}`);
          })
      }
      return <div>Hello {playerInfo.displayName}, please wait while I look up your game info...</div>
    }
    const onDumpRawIngredients = (e) => {
      this.setState({ statusMessage: "looking up raw ingredients..." });
      this.state.beGateway.getRawIngredients(playerInfo.gameId)
        .then((v) => {
          console.log('onDumpRawIngredients: res=', v);
          if (!v || v.length === 0) {
            this.setState({ statusMessage: "No raw ingredients found" });
          } else {
            var ingreds = v.map((bundle) => {
              return (<li>{bundle.name} (level {bundle.level})</li>);
            });
            this.setState({
              statusMessage: (<div>
                <span>There are {ingreds.length} raw ingredients:</span>
                <ol>{ingreds}</ol>
              </div>)
            });
          }
        });
    };
    return (
      <div>Hello {playerInfo.displayName}, what would you like to know about your '{this.state.gameInfo.name}' game?
        <br />
        <button onClick={(e) => onDumpRawIngredients(e)}> The raw ingredients</button>
        <div>{this.state.statusMessage}</div>
      </div>
    )
  }


  existingGamesUI() {
    if (this.state.playerGames === null) {
      switch (this.loadingState) {
        case this.BEFORE:
          this.loadingState = this.DURING;
          this.state.beGateway.getGamesFor(this.props.playerInfo.playerId)
            .then((v) => {
              this.loadingState = this.AFTER;
              this.setState({ playerGames: v });

            }).catch((e) => {
              this.loadingState = this.AFTER;
              this.setState({ statusMessage: `failure asking for current games ${e}` });
            });
            this.setState({ statusMessage: "asking for current games..." });
          break;
        case this.DURING:
          break;
        case this.AFTER:
          return <div>After asking for games</div>
          break;
      }
      return "";
    } else {
      const columns = [
        { title: 'name', dataIndex: 'name', 
          sorter:(row1,row2) => {
            return row1.name.localeCompare(row2.name) }},
          {title: 'created', dataIndex: 'createdAt',
          sorter:(row1,row2) => row1.createdAtUnix - row2.createdAtUnix },
          {title: 'updated', dataIndex: 'updatedAt',
          sorter:(row1,row2) => row1.updatedAtUnix - row2.updatedAtUnix},
          {title: 'actions', dataIndex: 'actions'}
      ];
      let onLoad = (e, gameId) => {
        console.log(`onLoad: e=${e}, gameId=${gameId}`);
        console.log(`e.ct.gi = ${e.currentTarget.gameId}`);
        console.log(`e.t.gi = ${e.target.gameId}`);
      }
      let onDelete = (e, gameId) => {
        console.log(`onDelete: e=${e}, gameId=${gameId}`);
        console.log(`e.ct.gi = ${e.currentTarget.gameId}`);
        console.log(`e.t.gi = ${e.target.gameId}`);
      }


      let antInnards = this.state.playerGames.map((game,i) => {
        return {
          key: 'tr_' + i,
          name: game.name,
          createdAt: dayjs(game.createdAt).format("LLL"),
          createdAtUnix: dayjs(game.createdAt).unix(),
          updatedAt: dayjs(game.updatedAt).format("LLL"),
          updatedAtUnix: dayjs(game.updatedAt).unix(),
          actions: (<span>
            <button gameid={game._id} onClick={(e) => onLoad(e, game._id)}>Load</button>
            <button gameid={game._id} onClick={(e) => onDelete(e, game._id)}>Delete</button></span>)
        };
      });
      let preamble = `You have created ${this.state.playerGames.length} games`;
      return <div>
        <span>{preamble}</span>
        <Table columns={columns} dataSource={antInnards}/>
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
        <div>
          {this.statusMessage}
        </div>
      </div>
    )
  }
}

export default GamePage;