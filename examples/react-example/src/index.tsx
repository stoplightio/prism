import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { hello } from './hello';

const Hello: React.SFC<{ hi: string }> = params => {
  return (
    <div>
      <h2>Hello Prism!</h2>
      <div>{params.hi}</div>
    </div>
  );
};

hello('hi').then(output => {
  ReactDOM.render(<Hello hi={output.input} />, document.getElementById('root'));
});
