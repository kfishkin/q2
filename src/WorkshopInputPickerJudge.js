import React from 'react';
import { Select, Space } from 'antd';
import CardsModal from './CardsModal';



// props:
// machine - the card for the machine that needs input
// beGateway - the be gateway
// deck - deck of Cards the player has
// baseCards hash of BaseCards in the game.
// onPilesChange - callback(newPiles) whenever piles have changed, and we think it's good to go.
class WorkshopInputPickerJudge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      cardsForModal: [],
      statusMessage: "",
      statusType: "",
      outline: null // the base card for the recipe outline
    }
  }

  makeAndSendPiles(outlineBase, deckByBaseCardId, currentAmounts, currentIngreds) {
    if (!this.props.onPilesChange) return;
    let piles = [];
    // the first pile is the recipe outline.
    piles.push([this.state.outline]);
    for (let step = 0; step < currentAmounts.length; step++) {
      let amount = currentAmounts[step];
      let ingredient = currentIngreds[step];
      // find (amount) cards for this ingredient...
      let thisPile = [];
      for (let i = 0; i < amount; i++) {
        let candidates = deckByBaseCardId[ingredient.GetId()];
        thisPile.push(candidates.shift());
        deckByBaseCardId[ingredient.GetId()] = candidates; // one less.
      }
      piles.push(thisPile);
    }
    //console.log(`piles = ${JSON.stringify(piles)}`);
    this.props.onPilesChange(piles);
  }

  render() {
    const NOT_PICKED = "not_picked";

    let pickOutlineUI = () => {
      let machine = this.props.machine;
      let level = machine.GetBase().GetLevel();
      // find the candidates:
      let candidates = this.props.deck.filter((card) => {
        let base = card.GetBase();
        // level must be <= the judges...
        if (base.GetLevel() > level) return false;
        // and it must be a recipe outline...
        if (!base.IsJudgeable()) return false;
        return true;
      });
      if (!candidates || candidates.length === 0) {
        return (
          <div>
            This level <b>{level}</b> {machine.GetBase().GetDisplayName()}
            requires a Recipe Outline card of this or less level, and you have
            none at present. Come back later!
          </div>
        )
      }
      let selectOptions = candidates.map((candidate) => {
        return {
          label: candidate.GetBase().GetDisplayName(),
          value: candidate.GetId()
        }
      });
      let onChange = (val) => {
        //console.log(`val = ${JSON.stringify(val)}`);
        let winner = candidates.find((candidate) => val === candidate.GetId());
        //console.log(`winner = ${JSON.stringify(winner)}`);
        // not part of state, because changes don't cause re-render.
        let outline = winner.GetBase().GetRecipeOutline();
        this.currentAmounts = Array(outline.num_steps).fill(NOT_PICKED);
        this.currentIngreds = Array(outline.num_steps).fill(NOT_PICKED);
        this.setState({ outline: winner });
        //this.props.onPilesChange([[winner]], false);
      }
      return (
        <div>
          <span>Which recipe outline would you like to use?: </span>
          <Select style={{width: 250}} onChange={(val) => onChange(val)} options={selectOptions}/>
        </div>
      )
    }
    let pickPilesUI = () => {
      // oy. There are (num_steps) steps. Each step there are a set of possible amounts,
      // and a set of possible ingredients. Need to figure out which of those ingredients
      // the player actually has, in an amount at least min(possible amounts).
      // if any of these are the empty set, let them know and don't waste their time on
      // the other stuff.
      // This could/should be a lot nicer looking....
      let outlineBase = this.state.outline.GetBase();
      let outlineInfo = outlineBase.GetRecipeOutline();

      let preamble = <span>The recipe has <b>{outlineInfo.num_steps}</b> steps.
      For each one, specify the ingredient to use, and in what amount.
      Ingredients that you don't have are shown <span className="dont_have">like this</span>.
      </span>;
      // need to figure out, for each ingredient, the cards they have for that ingredient:
      let deckByBaseCardId = {}; // from id to array of Cards.
      this.props.deck.forEach((card) => {
        let baseId = card.GetBase().GetId();
        let prev = (baseId in deckByBaseCardId) ? deckByBaseCardId[baseId] : [];
        prev.push(card);
        deckByBaseCardId[baseId] = prev;
      });
      let stepsUI = []; // array, react element for the UI for each step.

      // find previous scores against this outline, and let the use see them if they want.
      const showHistory= () => {
        let scoreCards = this.props.deck.filter((c) => c.GetBase().IsScore());
        console.log(`scoreCards = ${JSON.stringify(scoreCards)}`);
        // were any of them against this outline?
        // done as two .filter() instead of one for clarity.
        scoreCards = scoreCards.filter((c) => {
          let info = c.GetScoreInfo();
          if (info && info.outline_id === outlineBase.GetId()) {
            return true;
          }
          return false;
        })
        console.log(`scoreCards2 = ${JSON.stringify(scoreCards)}`);

        const showScoreCards = (scoreCards) => {
          this.setState({ showModal: true, cardsForModal: scoreCards});
        };
        if (scoreCards && scoreCards.length > 0) {
          return <button onClick={(e) => showScoreCards(scoreCards)}>See Scoring history</button>;
        }
        return "";
      }

      const checkPile = (firstStep) => {
        let allOk = true;
        let errors = [];
        let used = {}; // amount already used of this ingredient.
        for (let step = -1; step < this.currentAmounts.length; step++) {
          // tweak: do the first step first...
          if (step === firstStep) continue; // already did it
          let thisStep = (step === -1) ? firstStep : step;
          let amt = this.currentAmounts[thisStep];
          if (amt === NOT_PICKED) {
            allOk = false;
            continue;
          }
          let ingred = this.currentIngreds[thisStep];
          if (ingred === NOT_PICKED) {
            allOk = false;
            continue;
          }
          let have = (ingred.GetId() in deckByBaseCardId) ? deckByBaseCardId[ingred.GetId()].length : 0;
          if (ingred.GetId() in used) {
            have -= used[ingred.GetId()];
          }
          if (amt > have) {
            allOk = false;
            errors.push(`on step ${thisStep+1}, picked ${amt} of ${ingred.GetDisplayName()}, but only ${have} available`);
          } else {
            used[ingred.GetId()] = amt;
          }
        }
        if (allOk) {
          this.setState({statusMessage:'good to go', statusType: 'info'});
          this.makeAndSendPiles(outlineBase, deckByBaseCardId, this.currentAmounts, this.currentIngreds);
        } else {
          this.setState({statusMessage: errors.join(', and '), statusType: 'error'});
        }
      }

      const renderAmountSelect = (step, amts) => {
        const onAmountChange = (step, val) => {
          this.currentAmounts[step] = val;
          checkPile(step);
        }
        let selectOptions = amts.map((amt) => {
          return {
            label: amt,
            value: amt
          }});     
        return <Select style={{width: 50}} onChange={(val) => onAmountChange(step, val)} options={selectOptions}/>  
      };

      const renderIngredSelect = (step, ingredIds) => {
        let baseCards = this.props.baseCards;
        let selectOptions = ingredIds.map((id) => {
          let baseCard = baseCards[id];
          let amount = (id in deckByBaseCardId) ? deckByBaseCardId[id].length : 0;
          return {
            label: `${baseCard.GetDisplayName()} (${amount})`,
            value: id,
            dont_have: (amount === 0)
          }
        })
        const onIngredChange = (step, baseCardId) => {
          this.currentIngreds[step] = baseCards[baseCardId];
          checkPile(step);
        }

        return <Select style={{width:200}} onChange={(val) => onIngredChange(step, val)} options={selectOptions}
        optionRender={(option) => (
          <Space>
            <span className={option.data.dont_have?'dont_have':''}>
              {option.data.label}
            </span>
          </Space>
        )}/>;
      };

      for (let step = 0; step < outlineInfo.num_steps; step++) {
        let amts = outlineInfo.possible_amounts[step];
        let ingredIds = outlineInfo.possible_ingredients[step];
        stepsUI.push(
          <div className='picker_step'>
            <span className='leadin'>Step #{step + 1} :</span>
            <span>amount: {renderAmountSelect(step, amts)}</span>
            <span>, ingredient: {renderIngredSelect(step, ingredIds)}</span>
            </div>
        )
      }
      let epilogue = "";
      // no ternary operator because too long.
      if (this.state.statusMessage.length > 0) {
        epilogue = (<div className='status_message' flavor={this.state.statusType}><span className='status_text'>{this.state.statusMessage}</span></div>);
      }

      const handleOk = () => {
        this.setState({showModal: false});
      }

      return (<div>{preamble}{showHistory()}{stepsUI}{epilogue}
                <CardsModal title="Scores" open={this.state.showModal} onOk={handleOk} onCancel={handleOk}
            cards={this.state.cardsForModal}
            topHtml={<span>Previous score cards...</span>}
            bottomHtml=""
            baseCards={this.props.baseCards}
          /></div>);
    }

    if (this.state.outline) {
      return pickPilesUI();
    } else {
      return pickOutlineUI();
    }
  }
}

export default WorkshopInputPickerJudge;