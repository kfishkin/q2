import React from 'react';

export const VERSION = "1.3.3";

class AboutPage extends React.Component {
  render() {
    return (<div>
      <p>Version {VERSION}.</p>
      <p>Project is on Github at https://github.com/kfishkin/q2</p>
      <p>
        You can contact me at <a href="mailto:i.am.badger.ken@gmail.com">i.am.badger.ken@gmail.com</a>
      </p>
    </div>);
  }
}
export default AboutPage;
