import React from 'react';
import Card from './Card';
import StatusMessage from './StatusMessage';
import DeckComponent from './DeckComponent';


// props
// owner: the player structure for the 'nobody' that owns this loot
// beGateway
// gameInfo
// playerId
class LootPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      deck: null,
      loading: false,
      statusMessage: "",
      statusType: "info",
      inventory: null,
    };
    this.loading = false;
  }

  componentDidMount() {
    let gameInfo = this.props.gameInfo;
    console.log(`component did mount, owner = ${JSON.stringify(this.props.owner)}`);
    if (!this.state.deck && !this.loading) {
      this.setState({ statusMessage: `loading inventory...`, statusType: 'info' });
      console.log(`asking for inventory, game.gameId = ${gameInfo.gameId}, game._id=${gameInfo._id}, owner _id = ${this.props.owner._id}`);
      this.loading = true;
      this.props.beGateway.getPlayerCardsForGame(gameInfo.gameId, this.props.owner._id)
        .then((v) => {
          console.log(`got loot of ${JSON.stringify(v)}`);
          this.loading = false;
          let deck = v.map((dbObj) => new Card(dbObj));
          this.setState({ statusMessage: `loaded ${v.length}-cards of loot...`, statusType: 'success', deck: deck });
        }).catch((e) => {
          this.loading = false;
          console.error(`error getting loot: ${e}`);
          this.setState({ statusMessage: `failure loading loot: ${e}`, statusType: 'error' });
        })
    }
  }

  render() {
    if (!this.props.owner) {
      return <div>Oops, couldn't find the treasure</div>
    }
    let onDoLoot = (gameId, ownerId, playerId) => {
      console.log(`onDoLoot: game ${gameId}, owner ${ownerId} to player ${playerId}`);
      this.props.beGateway.lootRoom(gameId, ownerId, playerId).then((v) => {
        console.log(`onDoLoot: v = ${JSON.stringify(v)}`);
        this.setState({statusMessage: `loot transferred`, statusType: "success"});
      }).catch((e) => {
        console.log(`onDoLoot: e = ${e}`);
        this.setState({statusMessage: `failure transferring loot: ${e}`, statusType: "error"});
      })

    }
    let transferrable = (this.state.deck !== null && this.state.deck.length > 0);
    if (this.state.deck !== null && this.state.deck.length === 0) {
      return <div>Sorry, there was no treasure left in the room</div>
    }
    return <div>You found some treasure!
      <DeckComponent deck={this.state.deck} gameInfo={this.props.gameInfo} />
      <button onClick={(e) => onDoLoot(this.props.gameInfo.gameId, this.props.owner._id, this.props.playerId)}
        disabled={!transferrable}>Add to my deck</button>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>;
  }
}

export default LootPage;