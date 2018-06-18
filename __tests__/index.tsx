import * as React from 'react';
import * as TestRenderer from 'react-test-renderer';
import {gearbox, transmission} from "../src";
import {Value} from "react-powerplug";

describe('Specs', () => {
  it('combine in all forms', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      context0: context1.Consumer as any,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const testRenderer = TestRenderer.create(
      <Gearbox render>
        {({context0, context1, context2}) => (
          <div>
            <span>{context0.v} - {context1.v} + {context2}</span>
            <Gearbox.train>
              {({context2: ctx}) => <i>{"42" + ctx}</i>}
            </Gearbox.train>
          </div>
        )}
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["1", " - ", "1", " + ", "42"]);
  });

  it('top level transmission', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext({v: 2});

    const Gearbox0 = gearbox({
      context0: context1.Consumer as any,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const Gearbox = gearbox({
      context0: context1.Consumer as any,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    }, {
      transmission: ({context0, context1, context2}) => ({sum: context0.v + context1.v + context2.v})
    });

    const testC = () => (
      <context2.Consumer>
        {({v0}) => <div>{v0}</div>}
      </context2.Consumer>
    )

    const testG = () => (
      <Gearbox0 render>
        {({context1}) => <div>{context1.v}</div>}
      </Gearbox0>
    )

    const testRenderer = TestRenderer.create(
      <Gearbox render>
        {({sum}) => (
          <span>{sum}</span>
        )}
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["4"]);
  });

  it('train', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      //context0: <context1.Consumer children={null}/>,
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const InnerComponent = () => (
      <Gearbox.train>
        {({context1, context2}) => <span>{context1.v} + {context2}</span>}
      </Gearbox.train>
    )

    const testRenderer = TestRenderer.create(
      <Gearbox>
        <div>
          <InnerComponent/>
        </div>
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["1", " + ", "42"]);
  });

  it('transmission', () => {
    const context1 = React.createContext({v: 1});
    const context2 = React.createContext("42");

    const Gearbox = gearbox({
      context1: <context1.Consumer children={null}/>,
      context2: () => <context2.Consumer children={null}/>,
    });

    const Ungear = transmission(Gearbox, ({context1, context2}) => ({sum: (+context1) + (+context2.v)}));

    const InnerComponent = () => (
      <Ungear render>
        {({sum}) => (
          <Gearbox.train>
            {({context1, context2}) => <span>{context1} + {context2.v} + {sum}</span>}
          </Gearbox.train>
        )}
      </Ungear>
    )

    const testRenderer = TestRenderer.create(
      <Gearbox>
        <Gearbox.transmission clutch={({context1, context2}) => ({context1: context2, context2: context1})}>
          <div>
            <InnerComponent/>
          </div>
        </Gearbox.transmission>
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["42", " + ", "1", " + ", "43"]);
  });

  it('state change', () => {
    const Gearbox = gearbox({
      v1: <Value initial={0}/>,
      v2: ({v2}: { v2: number }) => <Value initial={v2}/>,
      v3: <Value initial={2}/>,
    });

    let spyV1;
    let spyV2;
    let spyV3;

    const store = (v1, v2, v3) => {
      spyV1 = v1;
      spyV2 = v2;
      spyV3 = v3;
      return "spy";
    };

    const testRenderer = TestRenderer.create(
      <Gearbox render v2={1}>
        {({v1, v2, v3}) =>
          <div>
            {store(v1, v2, v3)}
            <span>{v1.value} + {v2.value} + {v3.value}</span>
          </div>
        }
      </Gearbox>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["0", " + ", "1", " + ", "2"]);

    spyV1.set('!');

    expect(testRenderer.root.findByType('span').children).toEqual(["!", " + ", "1", " + ", "2"]);

    spyV1.set('*');
    spyV3.set('^');

    expect(testRenderer.root.findByType('span').children).toEqual(["*", " + ", "1", " + ", "^"]);

    spyV2.set('_');

    expect(testRenderer.root.findByType('span').children).toEqual(["*", " + ", "_", " + ", "^"]);

  });

  it('added value change', () => {
    const Gearbox = gearbox({
      v1: <Value initial={0}/>,
    }, {
      transmission: (result, {added}: { added: number }) => ({
        ...result,
        added: added + result.v1.value
      })
    });

    let spyV1;
    let spyV2;

    const store = (v1, v2) => {
      spyV1 = v1;
      spyV2 = v2;
      return "spy";
    };

    const testRenderer = TestRenderer.create(
      <Value initial={42}>
        {v0 => (
        <Gearbox render added={v0.value}>
          {({v1, added}) =>
            <div>
              {store(v1, v0)}
              <span>{v1.value}{v0.value}{added}</span>
            </div>
          }
        </Gearbox>
        )}
      </Value>
    );

    expect(testRenderer.root.findByType('span').children).toEqual(["0","42","42"]);

    spyV2.set(20);

    expect(testRenderer.root.findByType('span').children).toEqual(["0","20","20"]);

    spyV1.set(10);

    expect(testRenderer.root.findByType('span').children).toEqual(["10","20","30"]);
  })
});
