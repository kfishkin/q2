import React from 'react';

// shows the user guide
class GuidePage extends React.Component {


  render() {
    const APP_NAME='Clean Sweep';
    return (<div style={{textAlign: 'left', backgroundColor: 'white'}}>
      <h2>'{APP_NAME}' User Guide</h2>
      <p>
        Thanks for trying the game! In this game, you play a monster-slayer,
        who wants to clean out, once and for all, a dungeon full of monsters. 
        You do this by making trips to the 'front lines', where you fight monsters one on one.
        You can then 'go home' to repair, recuperate, and learn. However, each time you go home,
        the dungeon gets tougher.
      </p>
      <p>
        You have a set of cards that you use to play the game. These cards can represent both 
        tangible things (a weapon, a piece of armor, an ingredient used in a recipe),
        and intangible things (knowledge). For example, the victory conditions are themselves a card, that you are given
        at the start of the game. Everything is a card, including money.
      </p>
      <p>
        One set of cards are called 'recipe' cards. These cards represent your ability to use <i>ingredient</i> cards
        to craft items. Those crafted items are themselves cards that you can add to your hand.
      </p>
      <p>
        At any time, you are in one of 3 places:
        <ol>
          <li><i>at home</i> - here is where you repair, recuperate, learn, and pack your <i>backpack</i> (see below)</li>
          <li><i>adventuring</i> - here is where you decide which monster to fight next, or whether to end your trip and go home. <i>You may only use cards that are in your backpack</i></li>
          <li><i>fighting</i> - you are in a fight</li>
        </ol>

      </p>
      <p>Let's go through each:</p>
      <h2>At Home</h2>
        Across the top of the screen, you will see a number of buttons, indicating
        the actions you may take.
        <ul>
          <li><i>Adminster Games</i> - create, delete, or switch games. All games are in 'ironman' mode - you can't save/reload earlier versions. It makes the game too easy.</li>
          <li><i>See your inventory</i> - brings up a table showing your current inventory. This is a table, you can click on a column name (e.g. 'name') to sort on that column.</li>
          <li><i>Pack your backpack</i> - as prep for adventuring, this lets you move items to and from your backpack. Only things in your backpack
          are accessible once adventuring.</li>
          <li><i>Go adventuring!</i> - go adventuring with the contents of your backpack.</li>
          <li><i>Buy wholesale</i> - lets you buy recipe ingredients in bulk.</li>
          <li><i>Buy retail</i> - lets you buy individual items, such as a weapon or piece of armor</li>
          <li><i>Sell retail</i> - lets you sell items you no longer need/want</li>
          <li><i>See the cashier</i> - lets you condense your money cards, e.g. turn those 10 $1 bills into a single $10 bill</li>
          <li><i>Go to the workshop</i> - Recipes are either <i>locked</i> or <i>unlocked</i>. Only unlocked recipes are usable. The workshop will show
          you your <i>unlocked</i> recipe cards and let you use them. For example, you start the game with an unlocked 'Forensics card':
          <br/>
          <img src="pix/doc/guide/forensics.png" alt=''></img>
          <br/>
          The 'Forensics' card lets you destroy one of your cards, in return for 
          obtaining a locked recipe for how to make that card (if there is such a recipe).
          To use a recipe card, click on it. For example, clicking on 'Forensics' you see:
          <br/>
          <img src="pix/doc/guide/forensics_detail.png" alt=''></img>
          <br/>
          On the left, you see which recipe you are using, and a button that lets you change to a different one.
          On the right, you see where you specify the 'inputs' to the recipe. Each recipe has a different set of inputs,
          of varying types. For example, the Forensics recipe requires input of a piece of gear (armor or weapon):
          <br/>
          <img src="pix/doc/guide/forensics_dropdown.png" alt=''></img>
          <br/>
          </li>
          <li><i>Go to the blacksmith</i> - the blacksmith can repair worn armor and weapons, for a (steep) price. If you wish, you can learn how to repair these items yourself
          (repair armor using the 'Anvil' recipe, weapons using the 'Whetstone' recipe) or even how to create new ones.</li>
          <li><i>Unlock recipes</i> - when you originally get a recipe, it is 'locked': you have the recipe in hand, but don't yet have the knowledge/experience to use it. That knowledge/experience is represented
          in the game by <i>lore</i>. You can think of this as like experience points/money for recipe learning. There are 3 types of lore:
          <ol><li><i>mundane</i> - 'generic' lore. Can be used to learn any recipe. Most useful, but hardest to get in quantity</li>
          <li><i>recipe-bound</i> - lore that can only be used to learn a <i>specific</i> recipe. When you learn how to make a 'lower-level' recipe, you are often rewarded with lore specific
          to learning a higher-level version. When you learn how to make a short sword for example, you are rewarded with some
          lore that is 'recipe-bound' to the long sword.</li>
          <li><i>affinity-bound</i> - lore that can only be used to learn a recipe of a specific affinity. There are 4 Affinities in the game: Earth, Air, Fire, and Ice. More on these later, for now
          what matters is that affinity-bound lore can only be used to learn a recipe of that affinity. For example, the recipe for 'Fire enchantment' requires Fire lore.</li>
          </ol>
          TODO: add more showing unlocking in action
          </li>
          <li><i>Study lore</i> - this lets you spend money to get some mundane lore (see above)</li>.
          <li><i>Dissassemble stuff</i> - this needs a better name :). Just like the 'Forensics' recipe lets you destroy items to get a locked recipe for that item,
          'disassemble stuff' lets you destroy items to (hopefully) extract some lore out of them.</li>
          <li><i>News</i> - the game will send you various 'news stories' from time to time, typically notification that you have been awarded something.</li>
          <li><i>View trophies</i> - you can get awards/trophies during the game. This lets you see them.</li>
        </ul>
        <h2>Adventuring</h2>
        While adventuring, you will see a stylized layout of the 'front lines' of your fight to clear the dungeon:
        <br/>
        <img src="pix/doc/guide/away_map.png" alt=''></img>
        <br/>
        <p>
        The front lines are divided into 4 zones, one for each Affinity. Earth (top left), Fire (top right),
        Ice (bottom left), and Air (bottom right).
        </p>
        <p>
          Each zone has 4 rooms. Rooms with a '?' on top of their logo have unknown monsters in them.
          Rooms showed grayed-out are rooms you have cleared out this trip. For example, in the above screen grab,
          the right-most room in the 'Earth' zone has been cleared.
        </p>
        <p>
          Most of the top buttons have already been described from being on the 'Home' screen,
          here are the new ones:
          <ol>
            <li><i>View your backpack</i> - shows you what's in your backpack. This will grow with the loot 
            you get from clearing out rooms</li>
            <li><i>Go Home</i></li> - lets you end your adventuring. There are pros and cons to making this choice:
            <h3>Pros of going home</h3>
            <ol>
              <li><i>Recuperation</i> - once home, you can repair all worn-out items, learn new recipes, use existing ones, and buy/sell.</li>
              <li><i>Stash</i> - everything in your backpack will be added to your permanent main inventory</li>
              <li><i>Discretion is the better part of valor</i> - if you think you're likely to lose the next battle, better to call it a day and go home now.</li>
            </ol>
            <h3>Cons</h3>
            <ol>
              <li><i>Dungeon recuperation</i> - when you go home, any rooms you cleared will be repopulated, <i>with tougher monsters</i> - the dungeon
              is responding to your pillage. Even some of the monsters in rooms you <i>didn't</i> visit may also get tougher, as the dungeon
              raises its defenses.</li>
              <li><i>Lost potential bonuses</i> - if you clear out every room in a zone, this is called a 'Clean Sweep'. Each clean sweep rewards you with
              a chunk of affinity-bound lore, and also potentially some enchanted gear. If you clear out every <i>zone</i>,
              this is called a 'Home Run', and you get rewarded with a chunk of mundane lore.
              So if you go home before clearing a zone (let alone all zones), you miss out on these
              possible rewards.</li>
              </ol>
          </ol>
        </p>
        <h2>Fighting</h2>
        When you click on a room, a fight will start. First, there's the "pre-fight" stage,
        where you're shown what you're fighting, and allowed to choose your armor/weapon 'loadout'.
        Whatever you choose can't be changed once the fight starts:
        <br/>
        <img src="pix/doc/guide/fight_start.png" alt=''></img>
        <br/>
        On the left, you see the monster you will be fighting. The number in the star is its <i>level</i>.
        On the right, you see a dropdown where you can choose which weapon to use (you don't have to use one),
        And which armor to use (you don't have to use one).
        <p>
          You will then either press the 'Start the Fight' button, or, if you prefer, the 'flee' button.
          <h3>Pros of fleeing</h3>
          <ol>
            <li><i>You survive</i> - you will live to fight another day.</li>
          </ol>
          <h3>Cons of fleeing</h3>
          <ol>
            <li><i>You lose almost everything in your backpack</i>. You don't lose lore or recipe cards,
            because fleeing doesn't make you dumber :).</li>
          </ol>
        </p>
        Once you press 'start the fight', on you go to the fight.
        Fighting is in a number of rounds, and continues until either you kill
        the monster, or it kills you.
        <h2>How to win a fight</h2>
        <p>
          Each round, you have an attack value. That is equal to your weapons value (e.g. '1' for the dagger above), minus
          any weapon wear (more on that later), plus any possible affinity bonus.          
        </p>
        <h4>The affinity bonus</h4>
          <p>
            Earth is opposed to Air, Fire is opposed to Ice. If you use a piece of gear
            <i>opposed</i> to the affinity of the monster, you get a +1. If you use a piece of gear
            <i>the same as</i> the affinity of the monster, you get a -1 ('home court advantage').
          </p>
          <p>
            OK, back to the fight. You now roll a 6-sided die. If that roll, plus your attack value, is greater than the
            monster level, then the monster is dead: you will win.
            There is a chance that your weapon will incur <i>wear</i> each round. your
            weapon can get worn down to a value of 0.
          </p>
          <p>
            If you don't kill the monster, then it gets to hit back...
          </p>
          <p>
            Each round, you have a defense value. That is equal to your armor value (e.g. '1' for padded armor),
            minus any armor wear, plus any affinity bonus (see above).
            You now roll a 6-sided die. If that roll, plus your defense value, is <i>less</i>
            than the monster level, than it has hit you.
          </p>
          <p>
            When the monster hits you, it reduces your armor value by 1 - another point of 'wear'.
            If you were wearing no armor, or your armor was down to a value of 0, then you're dead. Sorry.
          </p>



      </div>

    )
  }
}
export default GuidePage;
