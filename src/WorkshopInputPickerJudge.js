import React from 'react';
import { Select, Space } from 'antd';
import BuyNeededComponent from './BuyNeededComponent';
import CardsModal from './CardsModal';
import StepDisplay from './StepDisplay';



// props:
// gameId
// machine - the card for the machine that needs input
// beGateway - the be gateway
// deck - deck of Cards the player has
// baseCards hash of BaseCards in the game.
// onPlayerDeckBEChange
// onTurnCrank - f(piles), to start judging
// playerId
class WorkshopInputPickerJudge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      cardsForModal: [],
      currentAmounts: [],
      currentIngreds: [],
      statusType: "",
      buying: false,
      haveAll: false,
      outline: null // the base card for the recipe outline
    }
  }

  makePiles(deck, currentAmounts, currentIngreds) {
    let deckByBaseCardId = {}; // from id to array of Cards.
    deck.forEach((card) => {
      let baseId = card.getBase().getId();
      let prev = (baseId in deckByBaseCardId) ? deckByBaseCardId[baseId] : [];
      prev.push(card);
      deckByBaseCardId[baseId] = prev;
    });
    const NOT_PICKED = "not_picked";
    let piles = [];
    let needs = {};
    // the first pile is the recipe outline.
    piles.push([this.state.outline]);
    for (let step = 0; step < currentAmounts.length; step++) {
      let amount = currentAmounts[step];
      if (!amount || amount === NOT_PICKED) continue;
      let ingredient = currentIngreds[step];
      if (!ingredient || ingredient === NOT_PICKED) continue;
      let ingredientId = ingredient.getId();
      // find (amount) cards for this ingredient...
      let thisPile = [];
      for (let i = 0; i < amount; i++) {
        let candidates = deckByBaseCardId[ingredientId];
        if (!candidates || candidates.length === 0) {
          continue; // you don't have enough, if any.
        }
        thisPile.push(candidates.shift());
        deckByBaseCardId[ingredientId] = candidates; // one less.
      }
      if (thisPile.length < amount) {
        if (!needs[ingredientId]) {
          needs[ingredientId] = { needed: 0, baseCard: ingredient };
        }
        needs[ingredientId].needed += (amount - thisPile.length);
      }
      piles.push(thisPile);
    }
    console.log(`needed = ${JSON.stringify(needs)}`);
    return { piles, needs };
  }

  render() {
    const NOT_PICKED = "not_picked";

    let pickOutlineUI = () => {
      let machine = this.props.machine;
      let level = machine.getBase().getLevel();
      // find the candidates:
      let candidates = this.props.deck.filter((card) => {
        let base = card.getBase();
        // level must be <= the judges...
        if (base.getLevel() > level) return false;
        // and it must be a recipe outline...
        if (!base.isJudgeable()) return false;
        return true;
      });
      if (!candidates || candidates.length === 0) {
        return (
          <div>
            This level <b>{level}</b> {machine.getBase().getDisplayName()}
            requires a Recipe Outline card of level {level} or less, and you have
            none at present. Come back later!
          </div>
        )
      }
      let selectOptions = candidates.map((candidate) => {
        return {
          label: candidate.getBase().getDisplayName() + ' (level ' + candidate.getBase().getLevel() + ')',
          value: candidate.getId()
        }
      });
      let onPickOutline = (val) => {
        //console.log(`val = ${JSON.stringify(val)}`);
        let winner = candidates.find((candidate) => val === candidate.getId());
        //console.log(`winner = ${JSON.stringify(winner)}`);
        // not part of state, because changes don't cause re-render.
        let outline = winner.getBase().getRecipeOutline();
        this.setState({
          outline: winner,
          currentAmounts: Array(outline.num_steps).fill(NOT_PICKED),
          currentIngreds: Array(outline.num_steps).fill(NOT_PICKED)
        });
      }

      return (
        <div>
          <span>Which recipe outline would you like to use?: </span>
          <Select className='width250' onChange={(val) => onPickOutline(val)} options={selectOptions} />
        </div>
      )
    }
    const pickPilesUI = () => {
      // oy. There are (num_steps) steps. Each step there are a set of possible amounts,
      // and a set of possible ingredients. Need to figure out which of those ingredients
      // the player actually has, in an amount at least min(possible amounts).
      // if any of these are the empty set, let them know and don't waste their time on
      // the other stuff.
      // This could/should be a lot nicer looking....
      let outlineBase = this.state.outline.getBase();
      let outlineInfo = outlineBase.getRecipeOutline();

      let preamble = <span>The <b>{outlineBase.getDisplayName()}</b> recipe has <b>{outlineInfo.num_steps}</b> steps.
        For each one, specify the ingredient to use, and in what amount.
        Ingredients that you don't have are shown <span className="dont_have">like this</span>.
        Steps with <img src='pix/icons/consumed64.png' className='consumed_icon' alt='consumed'></img>
        by them show that the ingredient(s) will be destroyed as part of the judging.
      </span>;
      // need to figure out, for each ingredient, the cards they have for that ingredient:
      let deckByBaseCardId = {}; // from id to array of Cards.
      this.props.deck.forEach((card) => {
        let baseId = card.getBase().getId();
        let prev = (baseId in deckByBaseCardId) ? deckByBaseCardId[baseId] : [];
        prev.push(card);
        deckByBaseCardId[baseId] = prev;
      });
      let stepsUI = []; // array, react element for the UI for each step.

      // find previous scores against this outline, and let the use see them if they want.
      const showHistory = () => {
        let scoreCards = this.props.deck.filter((c) => c.isLearningFor(outlineBase.getId()));
        //console.log(`scoreCards2 = ${JSON.stringify(scoreCards)}`);

        const showScoreCards = (scoreCards) => {
          this.setState({ showModal: true, cardsForModal: scoreCards });
        };
        if (scoreCards && scoreCards.length > 0) {
          return <button onClick={(e) => showScoreCards(scoreCards)}>See Learnings</button>;
        }
        return "";
      }

      const checkPile = (firstStep) => {
        let allOk = true;
        let used = {}; // amount already used of this ingredient.
        for (let step = -1; step < this.state.currentAmounts.length; step++) {
          // tweak: do the first step first...
          if (step === firstStep) continue; // already did it
          let thisStep = (step === -1) ? firstStep : step;
          let amt = this.state.currentAmounts[thisStep];
          if (amt === NOT_PICKED) {
            allOk = false;
            continue;
          }
          let ingred = this.state.currentIngreds[thisStep];
          if (ingred === NOT_PICKED) {
            allOk = false;
            continue;
          }
          let have = ingred.ContainedInDeck(this.props.deck);
          //let have = (ingred.getId() in deckByBaseCardId) ? deckByBaseCardId[ingred.getId()].length : 0;
          if (ingred.getId() in used) {
            have -= used[ingred.getId()];
          }
          if (amt > have) {
            allOk = false;
          } else {
            used[ingred.getId()] = amt;
          }
        }
        if (allOk) {
          this.makePiles(this.props.deck, this.state.currentAmounts, this.state.currentIngreds);
          this.setState({ haveAll: true });
        } else {
        }
        return allOk;
      }

      const renderAmountSelect = (step, amts) => {
        const onAmountChange = (step, val) => {
          let currentAmounts = this.state.currentAmounts;
          currentAmounts[step] = val;
          this.setState({currentAmounts}, () => checkPile(step));
        }
        let selectOptions = amts.map((amt) => {
          return {
            label: amt,
            value: amt
          }
        });
        return <Select style={{ width: 50 }} onChange={(val) => onAmountChange(step, val)} options={selectOptions} />
      };

      const renderIngredSelect = (step, ingredIds) => {
        // if the ingredient id is a category, replace it with an array of base
        // cards, one for each they have in their deck.
        let selectBaseCards = [];
        ingredIds.forEach((ingredId) => {
          let baseCard = this.props.baseCards[ingredId];
          if (baseCard.isCategory()) {
            // however, if this was a category, need to collapse them from
            // cards back to base cards.            
            // annoying...
            let cardsOf = baseCard.ContainedInDeck(this.props.deck);
            let baseCards = {};
            cardsOf.forEach((c) => baseCards[c.getBase().getId()] = c.getBase());
            selectBaseCards.push(...Object.values(baseCards));
          } else {
            selectBaseCards.push(baseCard);
          }
        });
        // sort by Alpha
        selectBaseCards.sort((bc1, bc2) => bc1.getDisplayName().localeCompare(bc2.getDisplayName()));
        let selectOptions = selectBaseCards.map((baseCard) => {
          let amount = baseCard.ContainedInDeck(this.props.deck).length;
          return {
            label: `${baseCard.getDisplayName()} (${amount})`,
            value: baseCard.getId(),
            dont_have: (amount === 0)
          }
        })
        const onIngredChange = (step, baseCardId) => {
          let currentIngreds = this.state.currentIngreds;
          currentIngreds[step] = this.props.baseCards[baseCardId];
          this.setState({currentIngreds}, () => checkPile(step));
        }

        return <Select style={{ width: 200 }} onChange={(val) => onIngredChange(step, val)} options={selectOptions}
          optionRender={(option) => (
            <Space>
              <span className={option.data.dont_have ? 'dont_have' : ''}>
                {option.data.label}
              </span>
            </Space>
          )} />;
      };

      for (let step = 0; step < outlineInfo.num_steps; step++) {
        let amts = outlineInfo.possible_amounts[step];
        let ingredIds = outlineInfo.possible_ingredients[step];
        let consumed = outlineInfo.consumes[step];
        let consumedImg = consumed ? (<img className='consumed_icon' alt='consumed' src='pix/icons/consumed64.png' />) : '';
        stepsUI.push(
          <div className='picker_step'>
            <span className='leadin'><StepDisplay step={step} /><span> {consumedImg}: &nbsp;</span></span>
            <span>{renderAmountSelect(step, amts)}</span>
            <span> of  {renderIngredSelect(step, ingredIds)}</span>
          </div>
        )
      }

      const epilogue = () => {
        const onInitiate = (baseCardIds) => {
          console.log(`onInitiate: baseCardIds = ${baseCardIds.join()}`);
          this.setState({ buying: true });
          this.props.beGateway.buyBulk(this.props.gameId, this.props.playerId, baseCardIds).then((v) => {
            this.props.onPlayerDeckBEChange();
            this.setState({ buying: false });
            this.makePiles(this.props.deck, this.state.currentAmounts, this.state.currentIngreds);
          }).catch((e) => {
            console.log(e);
            this.setState({ buying: false });
          });
        }
        let { needs } = this.makePiles(this.props.deck, this.state.currentAmounts, this.state.currentIngreds);

        return (<div>
          <BuyNeededComponent buying={this.state.buying} deck={this.props.deck} gameId={this.props.gameId}
            needs={needs} onInitiate={onInitiate} beGateway={this.props.beGateway} />
        </div>);
      }

      const doitUI = () => {
        let { piles } = this.makePiles(this.props.deck, this.state.currentAmounts, this.state.currentIngreds);
        //let haveAll = numNonEmpty >= outlineInfo.num_steps + 1;
        return (<div className="postamble">
          <button id="machine_do" disabled={!this.state.haveAll} onClick={(e) => this.props.onTurnCrank(piles)}> Judge </button>
        </div>);
      }

      const handleOk = () => {
        this.setState({ showModal: false });
      }

      return (<div>{preamble}{showHistory()}{stepsUI}{doitUI()}{epilogue()}
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