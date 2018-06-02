import * as React from 'react';
import {Value} from 'react-powerplug'
import {gearbox, transmition} from "../src";


const St = gearbox({
  v1: <Value initial={10}/>,
  v2: ({v}: { v: number }) => <Value initial={v}/>,
  v3: <Value initial={20}/>
});

const Sub = () => (
  <St.train>
    {({v1, v2, v3}) => (
      <div> train :
        ST:{v1.value}-{v2.value}-{v3.value}
      </div>
    )}
  </St.train>
);

const Transformer: React.SFC = ({children}) => (
  <St.transmission clutch={({v1, v2, v3}) => ({v3: v1, v2, v1: v3})}>
    <div>{children}</div>
  </St.transmission>
)

const SubSt = transmition(St, ({v1, v2, v3}) => ({sum: v1.value + v2.value + v3.value}))

const App = () => (
  <div>
    <Value initial={99}>
      {(v0: any) => (
        <div>
          {v0.value}!!
          <St render v={42}>
            {({v1, v2, v3}) => (
              <span>
                <button onClick={() => v0.set(v0.value + 1)}>b0</button>
                ST:{v0.value}-{v1.value}-{v2.value}-{v3.value}
                <button onClick={() => v1.set(v1.value + 1)}>b1</button>
                <button onClick={() => v2.set(v2.value + 1)}>b2</button>
                <button onClick={() => v3.set(v3.value + 1)}>b3</button>

                <Sub/>

                <Transformer>
                  <Sub/>
                </Transformer>
                <SubSt>
                  <div>
                    Sum:

                    <SubSt.train>
                      {({sum}) => <span>{sum}</span>}
                    </SubSt.train>
                  </div>
                </SubSt>
              </span>

            )}
          </St>
          +
        </div>
      )}
    </Value>
  </div>
);

export default App;