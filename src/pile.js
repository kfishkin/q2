// simple cache, maps from mongo ids to real objects/classes
// unlike a cache, doesn't expire, hence the name.
class Pile {
    constructor() {
        this.pile = {};
    }

    add(key, val, what) {
        // 'what' is there for debugging.
        this.pile[key] = val;
    }

    get(key) {
        return this.pile[key];
    }

    remove(key) {
        delete this.pile[key];
    }
}
export default Pile;