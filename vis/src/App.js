// @flow
import React, { Component } from "react";

import SCCFigure, {Fig1Options} from "./SccFig1";
import SCCFig2, { Fig2Options } from "./SccFig2";
import {CsccFig4} from './SccFig4.js';

import "./App.css";


class App extends Component {

  state={
    selectedCountry: 'WLD',
  }

  render() {
    return (
      <div className="App">
        <CsccFig4 data={[{ISO3: 'USA', shareEmissions: 15.6, shareScc: 11.7, sccPerCapita: 0.3, logGdp: 10}]}/>
        <Fig2Options onCountrySelect={selectedCountry => this.setState({selectedCountry})} />
        <Fig1Options country={this.state.selectedCountry} onCountryChange={selectedCountry => this.setState({selectedCountry})} />
      </div>
    );
  }
}

export default App;
