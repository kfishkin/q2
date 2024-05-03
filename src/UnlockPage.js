import React from 'react';
import {Switch} from 'antd';
import StatusMessage from './StatusMessage';
import CardDetail from './CardDetail';

/**
 * lets you 'unlock' locked recipes
 * 
 * props
 * baseCards - { id: BaseCard}
 * beGateway
 * deck - [Card]
 * gameId
 * playerId
 */

class UnlockPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      unlocking: false,
      statusText: null,
      statusType: 'info',
      recipes: [],
      selectedRecipe: null,
      loreCards: [],
      loreChosen: [], // array of booleans, on = chosen. parallel to (lorecards)
      loreGoal: 0,
      loreHave: 0,
    }
  }

  componentDidMount() {
    let recipes = this.props.deck.filter((card) => {
      return card.getBase().isRecipe() && card.isLocked() });
    let loreCards = this.props.deck.filter((card) =>
      card.getBase().isLore());
      let loreChosen = new Array(loreCards.length).fill(false);

      this.setState({recipes, loreCards, loreChosen});
  }

  checkScore() {
    // either the recipe or a lore card's chosen-ness has changed.
    // recompute the current score, and set state accordingly.
    console.log(`checkScore: called`);
    if (!this.state.selectedRecipe) {
      this.setState({loreGoal: 0, loreHave: 0});
      return;
    }
    let loreGoal = this.state.selectedRecipe.getBase().getRecipe().lore_cost;
    console.log(`goal = ${loreGoal}`);
    let loreHave = 0;

    for (let i = 0; i < this.state.loreCards.length; i++) {
      let loreCard = this.state.loreCards[i];
      let chosen = this.state.loreChosen[i];
      if (!chosen) continue;
      console.log(`look at lore # ${i}`);
      let val = loreCard.getDb().lore_info.value;
      console.log(`val = ${val}`);
      loreHave += val;
    }
    this.setState({loreGoal, loreHave});
  }

  recipeUI() {
    const NONE = "NONE";
    const onRecipeChoose = (option) => {
      console.log(`val = ${option.target.value}`);
      let recipe = this.state.recipes.find((card) => card.getId() === option.target.value);
      // changing the recipe resets all the selections...
      let loreChosen = this.state.loreChosen.map((v) => false);
      this.setState({selectedRecipe: recipe, loreChosen}, () => this.checkScore());
    }
    if (this.state.recipes.length < 1) {
      return (<div>(No locked recipes at present)</div>);
    } else {
      let options = this.state.recipes.map((card) => {
        return <option value={card.getId()}>{card.getBase().getDisplayName()}</option>
      });
      // add a 'pick one' header...
      options.unshift(<option value={NONE}>...recipe to unlock...</option>);
      return (<div>
        <select className='width200' onChange={(val) => onRecipeChoose(val)}>{options}</select>
        {this.state.selectedRecipe ? <CardDetail card={this.state.selectedRecipe} baseCards={this.props.baseCards} /> : ''}
        </div>
      );
    }
  }

  scoreUI() {
    if (!this.state.selectedRecipe) return '';

    const startUnlock = () => {
      console.log(`starting unlock...`);
      if (this.state.unlocking) return;
      if (!this.state.selectedRecipe) return;
      let recipeCardId = this.state.selectedRecipe.getId();
      if (!recipeCardId) return;
      let loreCardIds = [];
      for (let i = 0; i < this.state.loreCards.length; i++) {
        if (!this.state.loreChosen[i]) continue;
        loreCardIds.push(this.state.loreCards[i].getId());
      }

      this.setState({ statusText: 'distilling...', statusType: 'info', unlocking: true }, () => {
        this.props.beGateway.unlock(this.props.gameId, this.props.playerId, recipeCardId, loreCardIds).then((v) => {
          console.log(`unlock: v= ${JSON.stringify(v)}`);
          if (v.ok) {
            const makeMessage = (v) => {
              let msg = '';
              if (v && v.card && ('is_locked' in v.card) && !v.card.is_locked) {
                msg = 'Recipe unlocked';
              } else {
                msg = `weird card value: ${JSON.stringify(v.card)}`;
              }
              let numEaten = ('deleted' in v) ? v.deleted.length : 0;
              switch (numEaten) {
                case 0: break;
                case 1: msg = msg + ': 1 Lore card used';
                default:
                  msg = `${msg}: ${numEaten} Lore cards used`
              }
              if ((v.ledTo && v.ledTo.length > 0) || (v.loreTo && v.loreTo.length > 0)) {
                msg = `${msg}. And you made new discoveries! Check inventory.`;
              }
              return msg;
            }
            let msg = makeMessage(v);
            this.setState({ statusText: msg, statusType: 'success', unlocking: false });
          } else {
            this.setState({ statusText: v.why, statusType: 'error', unlocking: false });
          }
          this.props.onPlayerDeckBEChange();
        }).catch((e) => {
          console.log(`err: e = ${e}`);
          this.setState({ statusText: `error! ${e}`, statusType: 'error', unlocking: false });
        })
      })
    }

    const buttonUI = () => {
      if (this.state.loreHave < this.state.loreGoal) return '';
      return <button className='buy_button' onClick={() => startUnlock()}>Unlock!</button>

    }
    return (<div>
      <span>Needed: {this.state.loreGoal}</span>
      <br/>
      <span>Selected: {this.state.loreHave}</span>
      <br/>
      {buttonUI()}
    </div>);
  }

  loreUI() {
    const loreCardUI = (card, i) => {
      const onLoreCardCheckChange = (card, i, checked) => {
        console.log(`card ${card.terselyDescribe()}, checked = ${checked}`);
        let loreChosen = this.state.loreChosen;
        loreChosen[i] = checked;
        this.setState({loreChosen}, () => this.checkScore());

      }
      let whyNot = this.state.selectedRecipe ? card.canUseToUnlockRecipe(this.state.selectedRecipe.getBase()) : 'no recipe chosen';

      return (<div style={{textAlign: 'left'}}>
        <span><Switch disabled={!!whyNot} checked={this.state.loreChosen[i]} title={whyNot} onChange={(checked) => onLoreCardCheckChange(card, i, checked)}/></span>
        <span>{card.terselyDescribe()}</span>
      </div>)
    }

    if (this.state.loreCards.length < 1) {
      return (<div>(No lore cards)</div>);
    } else {
      let rows = this.state.loreCards.map((card, i) => loreCardUI(card, i));
      return (<div>
        <span>Lore cards in your deck:</span>
        <hr/>
        {rows}
        </div>
      );
    }
  }

  unlockUI() {
    const preamble = () => {
      return <div className='preamble'>
        <i>Unlock</i> recipes to make them usable in the Workshop.
        To unlock them, supply a number of Lore points &ge; the Lore cost of the recipe.
        Not all Lore cards apply to all recipes:
        <ul>
          <li><i>Affinity</i> lore can only be used to unlock spells of that Affinity.
          For example, a 'Fire lore' card can only be used to unlock spells like 'Fire enchant'</li>
          <li><i>Recipe</i> lore can only be used to unlock a particular recipe.
          For example, a 'Dagger' lore card can only be used to unlock the Dagger recipe.</li>
        </ul>
        Below, pick the recipe you wish to unlock. Then use the toggle switches indicate which lore to use. <i>No 'change' is given</i>.
        The switches are disabled if the lore card isn't usable for the current recipe.
      </div>
    }
    return <div>
      {preamble()}
      <hr/>
      {this.state.statusText ? <StatusMessage message={this.state.statusText} type={this.state.statusType} /> : ''}
      <table>
        <tbody>
          <tr>
            <td>{this.recipeUI()}</td>
            <td>{this.scoreUI()}</td>
            <td>{this.loreUI()}</td>
          </tr>
        </tbody>
        </table>
    </div>
  }

  render() {
    if (this.state.unlocking) {
      return (<div>'Unlocking...'</div>);
    } else {
      return (<div>
        {this.unlockUI()}
      </div>)
    }
  }
}

export default UnlockPage;
