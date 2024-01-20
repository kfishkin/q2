
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
}
export default BEGateway;