
class BEGateway {
    constructor(beURI) {
        this.beURI = beURI;
    }

    getURI() {
        return this.beURI;
    }

    setURI(newURI) {
        this.beURI = newURI;
    }

    /**
     * Checks if a player exists with the given handle and password.
     * If true, resolves to { handle, name, gameId }
     */
    async playerExists(handle, password) {
        console.log(`checking if ${handle} player exists`);
        // TODO: SALT/encrypt password
        const url = this.beURI 
            + "players/" + handle
            + "?pwd=" + password
        console.log('url', url);
        const response = await fetch(url, {mmmmode: 'no-cors'});
        console.log('playerExists: response = ' + response + ' ok = ', response.ok);
        //console.log('body =', JSON.stringify(response.body));
        return response.json();
    }

    /**
     * Gets a suggested game name. Resolves to a string
     */
    async suggestGameName() {
        const url = this.beURI 
        + "games/name";
    console.log('suggestGameName: url', url);
    const response = await fetch(url);
    console.log('suggestGameName: response = ' + response + ' ok = ', response.ok);
    //console.log('body =', JSON.stringify(response.body));
    return response.text(); 
    }

    /**
     * Creates a new game. Returns the game object as a dict.
     */
    async createGame(name) {
        const url = this.beURI 
        + "games";
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        }
        const response = await fetch(url, requestOptions);
        console.log('createGame: response = ' + response + ' ok = ', response.ok);
        return response.json();
    }

    async createPlayer(handle, displayName, email, password) {
        const url = this.beURI 
        + "players";
        var newPlayerData = {
            handle: handle,
            password: password,
            email: email,
            name: displayName
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlayerData)
        };
        const response = await fetch(url, requestOptions);
        console.log('createPlayer: response = ' + response + ' ok = ', response.ok);
        return response.ok ? response.json() : {};
    }
}
export default BEGateway;