// @flow
import React, { Component } from "react";

import SCCFigure, {Fig1Options} from "./SccFig1";
import SCCFig2, { Fig2Options } from "./SccFig2";
import {CsccFig4} from './SccFig4.js';

import "./App.css";
/*
const fig1Filter = country => row =>
  row.eta === "1p5" && row.prtp === "2" && row.ISO3 === country;

const fetchCountryFig1 = (countryName, filterFn) => {
  const data = [];
  const test = fig1Filter(countryName);
  Papa.parse(`${process.env.PUBLIC_URL}/cscc_v1.csv`, {
    download: true,
    header: true,
    dynamicTyping: name => ["16.7%", "50%", "83.3%"].includes(name),
    step: (results, parser) => {
      const row = results.data[0];
      if (test(row)) {
        data.push(row);
      }
    },
    complete: () => console.log(data)
  });
};
*/
class App extends Component {

  state={
    selectedCountry: 'WLD',
  }

  render() {
    return (
      <div className="App">
        <CsccFig4 data={[{ISO3: 'USA', shareEmissions: 15.6, shareScc: 11.7, sccPerCapita: 0.3, logGdp: 10}]}/>
        {false && <Fig2Options onCountrySelect={selectedCountry => this.setState({selectedCountry})} />}
        {false && <Fig1Options country={this.state.selectedCountry} onCountryChange={selectedCountry => this.setState({selectedCountry})} />}
      </div>
    );
  }
}

export default App;
