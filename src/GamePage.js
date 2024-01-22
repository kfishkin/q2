import React from 'react';

// props:
// playerInfo - dict from top level.
// beGateway - BE gateway
// onCreateGame - f(id,name) callback when a new game is created.

class GamePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      beGateway: props.beGateway,
      gameNameSuggestion: "",
      gameInfo: null,
      dumpMessage: null,
    }
  }

  askForNewGameName() {
    this.props.beGateway.suggestGameName()
    .then((v) => {
      //console.log('suggested game name =', v);
      this.setState({gameNameSuggestion: v});
    })
    .catch((e) => { console.log("error on get suggestion: ", e)});    
  }

  createNewGameUI(playerInfo) {
    const INPUT_ID="gameName";
    const component = this;
    if (!this.state.gameNameSuggestion) {
      this.askForNewGameName();
    }
    const suggestion = this.state.gameNameSuggestion;
    // couldn't get Ant <Input> or <Form> to work properly, do it at the lower level...
    let inputValue=suggestion;
    const onChange = (e) => {
      inputValue = e.currentTarget.value;
    }
    const onSubmit = (e) => {
      console.log('onSubmit, iv=', inputValue);
      if (!inputValue) return;
      component.state.beGateway.createGame(inputValue, playerInfo.playerId)
      .then((v) => { 
        console.log('onSubmit.createGame.then, v=', JSON.stringify(v));
        // a failed game creation comes back as an empty object.
        if (!v.name) {
          component.setState({
            debugMessage: `failed game creation for ${inputValue}`
          });
        } else {
          component.props.onCreateGame(v._id, v.name);
        }
      })

      .catch((e) => { 
        // happens on fail
        component.setState({
          debugMessage: `failed create-game for ${inputValue}`
        });
      });

    }

    let elt = document.getElementById(INPUT_ID);
    if (elt) {
      //console.log("elt=", elt);
      //console.log("elt.value=", elt.value);
      //doing the below on an Ant <Input> or <Form> doesn't work,
      // must do setFieldValues on the form object, which I ain't got.
      elt.value = suggestion;
    }



    return (
       <div>Hello {playerInfo.displayName}. You have no game going, would you like to create one?
       <br/>
       Game name:&nbsp;&nbsp;
        <input id={INPUT_ID} type="text"  reqired="required"
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
      this.state.beGateway.getGameInfo(playerInfo.gameId)
        .then((v) => {
          console.log(`dumpGameUI: v = ${v}`);
          let gameInfo = { ...v};
          gameInfo.gameId = v._id;
          this.setState({gameInfo: gameInfo});
        })
        .catch((e) => {
          console.log(`dumpGameUI: e = ${e}`);
        })
      return <div>Hello {playerInfo.displayName}, please wait while I look up your game info...</div>
    }
    const onDumpRawIngredients = (e) => {
      this.setState({ dumpMessage: "looking up raw ingredients..." });
      this.state.beGateway.getRawIngredients(playerInfo.gameId)
        .then((v) => {
          console.log('onDumpRawIngredients: res=', v);
          if (!v || v.length === 0) {
            this.setState({ dumpMessage: "No raw ingredients found" });
          } else {
            var ingreds = v.map((bundle) => {
              return (<li>{bundle.name} (level {bundle.level})</li>);
            });
            this.setState({ dumpMessage: (<div>
              <span>There are {ingreds.length} raw ingredients:</span>
              <ol>{ingreds}</ol>
            </div>)});
          }
        });
    };
    return (
      <div>Hello {playerInfo.displayName}, what would you like to know about your '{this.state.gameInfo.name}' game?
      <br />
      <button onClick={(e) => onDumpRawIngredients(e) }> The raw ingredients</button>
      <div>{this.state.dumpMessage}</div>
      </div>
    )
  }

  render() {
    let playerInfo = this.props.playerInfo;
    
    if (!playerInfo || !playerInfo.handle) {
      return <div>No game yet, you are not logged in</div>
    }
    let {gameId} = playerInfo;
    if (!gameId) {
      return this.createNewGameUI(playerInfo);
    }

    return (
      this.dumpGameUI(playerInfo)
    )
  }
}

export default GamePage;