import React from 'react';
import { PlayerTypes } from './PlayerTypes';
import { MERCHANT_PAGE } from './NavMenu';


  // props
  // map - the map to render
  // showPageFunc - invoke to show a different page in the UI.
  // gameId - gameId.
class MapComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  // you can visit any room which is a hallway or a shop,
  // or reachable from same.
  // annotates each room with a 'reachable' boolean...
  computeReach() {
    let map = this.props.map;
    let stack = []; // (row, col) to explore out from.
    for (let row = 0; row < map.height; row++) {
      let rooms = map.rooms[row];
      for (let col = 0; col < map.width; col++) {
        // TODO: make this an attribute, not kludged:
        let room = rooms[col];
        if (room.title.startsWith("Shop")
        || room.title.startsWith("Hallway")) {
        room.reachable = true;
        stack.push([row, col]);
      }
      }
    }
    // explore ye olde stacke. Stack are places known to be reachable.
    while (stack.length > 0) {
      let tuple = stack.shift();
      let meRow = tuple[0];
      let meCol = tuple[1];
      // let room = map.rooms[meRow][meCol];
      for (let row = meRow - 1; row <= meRow + 1; row++) {
        if (row < 0 || row >= map.height) continue;
        for (let col = meCol - 1; col <= meCol + 1; col++) {
          if (col < 0 || col >= map.width) continue;
          if (!map.rooms[row][col].reachable) {
            map.rooms[row][col].reachable = true;
            //console.log(`can reach ${row},${col} from ${meRow}, ${meCol}`);
            //stack.push([row, col]);
          }

        }
      }
    }
  }

  render() {
    let map = this.props.map;
    if (!map || map.length === 0) {
      return <div>No map.</div>
    }
    let width = map.width || 0;
    let height = map.height || 0;
    let y = (height >> 1); // start at the top in cartesian
    //let x = 1 - (width >> 1); // and the left.
    this.computeReach();
    let rows = []; // react nodes, one per row

    let showPageFunc = this.props.showPageFunc;
    let gotoShop = (owner) => {
      console.log(`gotoShop: owner = ${JSON.stringify(owner)}`);
      let ok = window.confirm(`go to ${owner.name}'s shop?})`);
      if (ok) {
        showPageFunc(MERCHANT_PAGE, {owner: owner});
      }
    }

    for (let row = 0; row < height; row++, y--) {
      let label = <span><b>{y}: </b></span>
      let cols = []; // react nodes, one per room
      let rooms = map.rooms[row];
      for (let col = 0; col < width; col++) {
        let room = rooms[col];
        let reachable = room.reachable;
        let reachableStyle = reachable?"yes":"no";
        // kludge: should remember whether you've been there,
        // win or loss.
        // another kludge special case for shop...
        let elt = null;
        if (room.owner && room.owner.type === PlayerTypes.MERCHANT) {
          elt=<button reachable={reachableStyle} onClick={(e) => gotoShop(room.owner)}>{room.owner.name}'s {room.title}</button>
        } else if (room.title.startsWith("Hallway")) {
          //  kludge
          elt=<span reachable={reachableStyle}>&nbsp;{room.title}&nbsp;</span>
        } else {
          elt=<span reachable={reachableStyle}>&nbsp;  ???? &nbsp;</span>
        }

        cols.push(elt);
      }
      rows.push(<div><span>{label}  </span>{cols}</div>)
    }
    return <div>
    <br/>{rows}</div>;
  }
}
export default MapComponent;
