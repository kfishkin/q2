import React from 'react';


// tiny component to display a 0-based step #
// however we want...

// props:
//  step - the #
//  terse - if true, then just the #.
class StepDisplay extends React.Component {

  render() {
    // for now, how we want is A, B, C, ...
    const stepLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let stepNumber = ('step' in this.props) ? this.props.step : 0;
    return this.props.terse ? stepLabels[stepNumber]
    : <span className='step'>Step {stepLabels[stepNumber]}:</span>
  }
}
export default StepDisplay;
