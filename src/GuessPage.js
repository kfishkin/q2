import React from 'react';

class GuessPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            guessee: 0 // the recipe being guessed at. 0 = undef.
        }
    }

    render() {
        return (<div>
            Hello from the Guess page.

        </div>);
    }
}
export default GuessPage;
