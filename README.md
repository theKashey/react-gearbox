⚙️📦 GearBox 
=======
[![Build Status](https://travis-ci.org/theKashey/react-gearbox.svg?branch=master)](https://travis-ci.org/theKashey/react-gearbox)
[![coverage-badge](https://img.shields.io/codecov/c/github/thekashey/react-gearbox.svg?style=flat-square)](https://codecov.io/github/thekashey/react-gearbox)
[![NPM version](https://img.shields.io/npm/v/react-gearbox.svg)](https://www.npmjs.com/package/react-gearbox)


Composes renderless containers and manages them in afterlive. 
Heavily inspired by [react-adopt](https://github.com/pedronauck/react-adopt)(context compose),
 [react-powerplug](https://github.com/renatorib/react-powerplug)(renderless containers)
 and [redux-restate](https://github.com/theKashey/restate)(fractal state).

The purpose of this library is
 - (torque) combine "container"(plugs, context, states), to form more complex structure (gearbox).
 - (transmission) provide a way to access them down the tree (train).
 - (gear train) provide a way to alter their work (transmission).

That's why - gearbox

# API

```js
import {gearbox} from 'react-gearbox';

// consume any "headless" component
const State = gearbox({
   name: <Value initial="Bruce Wayne" />,
   nick: <Value initial="Batman" />,
   team: <UnstatedContainer />,
   enemies: Context.Consumer
});

// create state and access via renderprops
<State render>
  {({nick}) => <span>cos I am {nick.value}</span>}
</State>

// create state, and access it later using train
<State>
  <span>cos I am <State.train>{({nick}) => nick.value}</State.train></span>
</State>

// unwrap powerplug using transmission
<State>
  <State.transmission clutch={({nick}) => ({nick: nick.value})}>
    <span>cos I am <State.train>{({nick}) => nick}</State.train></span>
  </State.transmission>
</State>
``` 

* `gearbox(gears, options?): Gearbox` - creates a Gearbox component. Where
 * `gears` is a shape of different _render-prop-ish_ components, for example:
      - ReactElements, or 
      - FunctionalStatelessComponents, or 
      - Context.Consumers.
  
  * `options` is an optional field.
      - options.transmission(input, props) => output - build in transmission, to be applied on gears.
      - options.defaultProps - set default props for a future component (note: defaultProps are not reflected on types, PR welcomed)

Produces a `Gearbox` - renderless container, which will provide _torque_ from all gears as a render prop.

* `transmission(gearboxIn, clutch): Gearbox` - created a devired Gearbox, with "clutch" function applied to all stored data. 
leftMenuController: <Toggle initial={} />,
   topMenuController: <Toggle initial={} />,
   toggler: gear(Toggle, { initial: {} }), // ~ <Toggle initial={} children={mock} />
`Gearbox` is a compound component, and includes 2 sub components
* Gearbox.train - _React Context_ based long-range torque provider, which will provide access to the parent Gearbox from the nested components.
* Gearbox.transmission - establish a local (declarative) transmission. Might not be type safe.

`Gearbox` has only one prop - `render`, if not set - children is a ReactNode. If set - renderProp(function as a children)

`gear(component, props)` - a small helper to create elements, without mocking `children` prop 
 
## Rules
 - `Gearboxes` are used to combine gears together, and put them into context.
 - `trains` - to access distant gearbox.
 - `transmission` - to adapt data structure for the local needs.
 
## Adaptation
 Gearbox could merge output from different component using the keys as names.
 But sometimes you need a bit another structure, for example - just rename fields.
```js
import {gearbox, gear} from 'react-gearbox';
import {Toggle} from 'react-powerplug';

 const Gearbox = gearbox({   
   
  }, {
   transmission: ({leftMenuController, topMenuController}) => ({
     isLeftMenuOpen: leftMenuController.value,
     isTopMenuOpen: topMenuController.value,
     
     toggleLeftMenuOpen: leftMenuController.toggle,
     toggleTopMenuOpen: topMenuController.toggle     
   })
  });
```  

In the same way - you can create a new Components

```js
 const Switch = gearbox({   
   toggle: props => <Toggle {...props} />,
  }, {
   transmission: ({toggle}) => ({
     enabled: toggle.on,
     switch: toggle.toggle     
   }),
   defaultProps: {
     render: true, // render props as default
     local: false  // no context support
   }
  });

// new component adopted!
<Switch initial={true}>
 {({enabled, switch}) => ... }
</Switch>
``` 

The same technique could be used to achieve the same results as recompose's `withHandlers`
> While gearbox itself is `withState`.  

# Debugging

 Gearbox also provides a _fancy_ debugging. Just double check React Dev Tools.
 
 In addition:
  - setDebug(boolean | function) - enableds low-level debug.

 
# Examples

1. Create a gearbox  
```js
 import {gearbox} from 'react-gearbox';
 import {Value, Toggle} from 'react-powerplug';
 
 
 const Gearbox = gearbox({
   // pass a pre-created Element, as you could do with react-adopt
   storedValue: <Value initial={42} />,
   
   // pass component, to initialize Element from props (applied only on mount)
   toggle: props => <Toggle initial={props.on} />,
   
   // pass React.Context
   data: reactContext.Consumer as any, // !! "pure" consumers are not "type safe"
   
   // or pass it as React.Element
   context: <reactContext.Consumer children={null}/>,

   // you may access all the gearings from above
   smartComponent: (props, {data, context} /* all the props from above*/) => <OtherRenderProp />
   
   // Unstated container? Anything "render-prop" capable will work.
   stated: <UnstatedContainer />,
 }); 
```

2. Use Gearbox with or without renderprops 

By default Gearbox __expects ReactNode as a children__, and data to be accessed via `train`, but you may specify `render` prop, to change this behavior to function-as-children. 

> `render` stands for renderProps, `on` is required by `toggle`, so required by Gearbox
 ```js
 const App = () => (
     <Gearbox on render>
        {({storedValue, toggle, data, stated}) => <div>...</div>}
     </Gearbox>
 )
 
 const App = () => (
      <Gearbox on>
         <div>...</div>
      </Gearbox>
  )
 ```
3. Use Gearbox.train to get the data
```js 
 // once Gearbox is assembled - you can access it elsewhere using gear trains
 
 const Children = () => (
      <Gearbox.train>
         {({storedValue, toggle, data, stated}) => <div>...</div>}
      </Gearbox>
  )
```

4. Use Gearbox.transmission to adopt the data   
```js  
 // component based Transmission are NOT type safe
 const Transmission = () => (
     <Gearbox.transmission 
       clutch={({toggle, data}) => ({on:toggle.on, toggle: data.toggle})}
     >
         <Gearbox.train> {/* you may use <Gearbox.train_untyped> */ }
             {({on, toggle}) => <div>...</div>}
         </Gearbox.train>
     </Gearbox.transmission>
 )
 
const Transmission = () => (
     <Gearbox.transmission 
       clutch={({toggle, data}) => ({on:toggle.on, toggle: data.toggle})}
       render /* use as render prop */
     >         
             {({on, toggle}) => <div>...</div>}
     </Gearbox.transmission>
 )
```

4. Use transmission to achieve type safe transmission.
```js
const TransmittedGear = transmission(Gearbox, ({toggle, data}) => ({on:toggle.on, toggle: data.toggle}));
```
  
# Licence
 MIT
  
