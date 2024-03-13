import React from 'react';
import Card from './Card';
import StatusMessage from './StatusMessage';
import { DeckComponent } from './DeckComponent';


// props
// owner: the player structure for the 'nobody' that owns this loot
// beGateway
// gameInfo
// playerId
// onPlayerDeckBEChange={() => the deck has changed on the BE, reload.
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
    if (!this.state.deck && !this.loading) {
      this.setState({ statusMessage: `loading inventory...`, statusType: 'info' });
      console.log(`asking for inventory, game.gameId = ${gameInfo.gameId}, game._id=${gameInfo._id}, owner _id = ${this.props.owner._id}`);
      this.loading = true;
      this.props.beGateway.oldGetPlayerCardsForGame(gameInfo.gameId, this.props.owner._id)
        .then((v) => {
          this.loading = false;
          let deck = v.map((dbObj) => Card.Of(dbObj));
          this.setState({ statusMessage: `loaded ${v.length}-cards of loot...`, statusType: 'success', deck: deck });
          if (deck.length === 0) {
            console.log(`nothing to loot, updating map`);
            // this will mark the room as empty and traversable.
            this.onDoLoot(this.props.gameInfo.gameId, this.props.owner._id, this.props.playerId)
          }
        }).catch((e) => {
          this.loading = false;
          console.error(`error getting loot: ${e}`);
          this.setState({ statusMessage: `failure loading loot: ${e}`, statusType: 'error' });
        })
    }
  }

  onDoLoot(gameId, ownerId, playerId) {
    console.log(`onDoLoot: game ${gameId}, owner ${ownerId} to player ${playerId}`);
    this.setState({ statusMessage: `transferring...`, statusType: "info" });
    this.props.beGateway.lootRoom(gameId, ownerId, playerId).then((v) => {
      console.log(`onDoLoot: v = ${JSON.stringify(v)}`);
      this.setState({ statusMessage: `loot transferred`, statusType: "success" });
      this.props.onPlayerDeckBEChange();
    }).catch((e) => {
      console.log(`onDoLoot: e = ${e}`);
      this.setState({ statusMessage: `failure transferring loot: ${e}`, statusType: "error" });
    })
  }

  render() {
    if (!this.props.owner) {
      return <div>Oops, couldn't find the treasure</div>
    }


    let transferrable = (this.state.deck !== null && this.state.deck.length > 0);
    if (this.state.deck !== null && this.state.deck.length === 0) {
      return <div>An empty room.<br />(click on 'Game' to return to the map)</div>
    }
    let sortedDeck = this.state.deck||[];
    sortedDeck.sort((c1, c2) => c2.getBase().getSellValue() - c1.getBase().getSellValue());

    return <div>You found some treasure!
      <DeckComponent deck={sortedDeck} baseCards={this.props.gameInfo.baseCards} ronly={true} />
      <button onClick={(e) => this.onDoLoot(this.props.gameInfo.gameId, this.props.owner._id, this.props.playerId)}
        disabled={!transferrable}>Add to my deck</button>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>;
  }
}

export default LootPage;