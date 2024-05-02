import React from 'react';
import { DeckComponentDistillable } from './DeckComponent';
import StatusMessage from './StatusMessage';

/**
 * lets you 'distill' some of the stuff you have and see if you 
 * can get any lore out of it.
 * 
 * props
 * baseCards - { id: BaseCard}
 * beGateway
 * deck - [Card]
 * gameId
 * playerId
 */

class DistillPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      distilling: false,
      statusText: null,
      statusType: 'info',
    }
  }

  componentDidMount() {
  }

  onStartDistill(cards) {
    console.log(`wants to distill cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards || cards.length === 0) return;
    // there was already an 'are you sure' in DeckComponent, so just go for it...
    if (this.state.distilling) return;
    let cardIds = cards.map((card) => card.getId());
    this.setState({ statusText: 'distilling...', statusType: 'info', distilling: true }, () => {
      this.props.beGateway.distill(this.props.gameId, this.props.playerId, cardIds, true).then((v) => {
        console.log(`distill: v= ${JSON.stringify(v)}`);
        const toMessage = (lores) => {
          let msg = 'success';
          switch (lores.length) {
            case 0:
              msg = 'The distillation yielded no lore, sorry';
              break;
            case 1:
              msg = 'The distillation yielded a lore card: check your inventory for details';
              break;
            default:
              msg = `The distillation yielded ${lores.length} lore cards: check your inventory for details`;
          }
          return msg;
        }
        if (v.ok) {
          this.setState({ statusText: toMessage(v.lores), statusType: 'success', distilling: false });
        } else {
          this.setState({ statusText: v.why, statusType: 'error', distilling: false });
        }
        this.props.onPlayerDeckBEChange();

      }).catch((e) => {
        console.log(`err: e = ${e}`);
        this.setState({ statusText: `error! ${e}`, statusType: 'error', distilling: false });
      })
    })
  }



  distillUI() {
    const preamble = () => {
      return (<span>
        You may select some of your inventory and <i>dissassemble</i> it.
        <i>This will destroy the item(s) involved</i>, but it may yield some lore.
        This is usually more fruitful for non-mundane things (i.e. things that belong
        to a certain affinity).
      </span>);
    }

    let distillable = this.props.deck.filter((card) => card.getBase().isDistillable());
    return <div>
      {preamble()}
      {this.state.statusText ? <StatusMessage message={this.state.statusText} type={this.state.statusType} /> : ''}
      <hr />      <DeckComponentDistillable deck={distillable} baseCards={this.props.baseCards} current="yes"
        onTransact={(cards) => this.onStartDistill(cards)} />
    </div>
  }

  render() {
    if (this.state.distilling) {
      return (<div>'Distilling...'</div>);
    } else {
      return (<div>
        {this.distillUI()}
      </div>)
    }
  }
}

export default DistillPage;
