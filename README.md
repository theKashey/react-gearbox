⚙️ GearBox ⚙️
=======
[![Build Status](https://travis-ci.org/theKashey/react-gearbox.svg?branch=master)](https://travis-ci.org/theKashey/react-gearbox)
[![coverage-badge](https://img.shields.io/codecov/c/github/thekashey/react-gearbox.svg?style=flat-square)](https://codecov.io/github/thekashey/react-gearbox)
[![NPM version](https://img.shields.io/npm/v/react-gearbox.svg)](https://www.npmjs.com/package/react-gearbox)


Compose renderless containers like a pro. 
Heavily inspired by [react-adopt](https://github.com/pedronauck/react-adopt)(context compose),
 [react-powerplug](https://github.com/renatorib/react-powerplug)(renderless containers)
 and [redux-restate](https://github.com/theKashey/restate)(fractal state).

The purpose of this library is
 - (torque) combine "container"(plugs, context, states), to form more complex structure.
 - (transmission) provide a way to access them down the tree.
 - (gear train) provide a way to alter their work.

That's why - gearbox

# API

* `gearbox(gears, options?): Gearbox` - creates a Gearbox component. Where
 * `gears` is a shape of different _render-prop_ components, for example:
      - ReactElements, or 
      - FunctionalStatelessComponents, or 
      - Context.Consumers.
  
  * `options` is an optional field.
      - options.transmition(input, props) => output - build in transmition, to be applied on gears.

Produces a `Gearbox` - renderless container, which will provide _torque_ from all gears as a render prop.

* `transmission(gearboxIn, clutch): Gearbox` - created a devired Gearbox, with "clutch" function applied to all stored data. 

`Gearbox` is a compound component, and includes 2 sub components
* Gearbox.train - _React Context_ based long-range torque provider, which will provide access to the parent Gearbox from the nested components.
* Gearbox.transmission - establish a local (declarative) transmition. Might not be type safe.

`Gearbox` has only one prop - `render`, if not set - children is a ReactNode. If set - renderProp(function as a children)
 
## Rules
 - `Gearboxes` are used to combine gears together, and put them into context.
 - `trains` - to access distant gearbox.
 - `transmission` - to adapt data structure for the local needs.
 
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
   
   // Unstated container? Anything "render-prop" capable will work.
   stated: <UnstatedContainer />,
 }); 
```

2. Use Gearbox with or without renderprops 
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

4. Use transmission to achive type safe transmission.
```js
const TransmittedGear = transmission(Gearbox, ({toggle, data}) => ({on:toggle.on, toggle: data.toggle}));
```
  
# Licence
 MIT
  
