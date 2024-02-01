import React from 'react';
import Card from './Card';
import StatusMessage from './StatusMessage';
import DeckComponent from './DeckComponent';


  // props
  // owner: the player structure for the merchant that owns this shop.
  // beGateway
  // gameInfo
class MerchantPage extends React.Component {
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
      this.setState({ statusMessage: `loading inventory...`, statusType: 'info'});
      console.log(`asking for inventory, game.gameId = ${gameInfo.gameId}, game._id=${gameInfo._id}, owner _id = ${this.props.owner._id}`);
      this.loading = true;
      this.props.beGateway.getPlayerCardsForGame(gameInfo.gameId, this.props.owner._id)
        .then((v) => {
          console.log(`got shopkeeper inventory of ${JSON.stringify(v)}`);
          this.loading = false;
          let deck = v.map((dbObj) => new Card(dbObj));
          this.setState({ statusMessage: `loaded ${v.length}-card inventory...`, statusType: 'success', deck: deck});
        }).catch((e) => {
          this.loading = false;
          console.log(`error getting inventory: ${e}`);
          this.setState({ statusMessage: `failure loading inventory: ${e}`, statusType: 'error'});
        })
    }
  }

  render() {
    if (!this.props.owner) {
      return <div>Oops, merchant page, but no merchant supplied</div>
    }

    return <div>Hello from the merchant page for merchant {this.props.owner.name}'s store.
    Merchant ID {this.props.owner._id}
    <DeckComponent deck={this.state.deck} gameInfo={this.props.gameInfo}/>
    <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>;
  }
}

export default MerchantPage;