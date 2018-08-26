// @flow
import React, { Component } from "react";

import SCCFigure from "./SccFig1";
import Papa from "papaparse";

// import wldData from "./wld_data";
// import usData from "./usa_data";
// import rusData from "./rus_data";

import "./App.css";

const fig1Filter = country => row => row.eta === '1p5' && row.prtp === '2' && row.ISO3 === country;

const fetchCountryFig1 = (countryName, filterFn) => {
  const data = [];  
  const test = fig1Filter(countryName);
  Papa.parse(`${process.env.PUBLIC_URL}/cscc_v1.csv`, {
    download: true,
    header: true,
    dynamicTyping: (name) => ['16.7%', '50%', '83.3%'].includes(name),
    step: (results, parser) => {
      const row = results.data[0];
      // console.log(row)
      if (test(row)) {
        data.push(row)
      }
    },
    complete: () => console.log(data)
  });
};

class App extends Component {
  state = { country: "WLD" };

  componentDidMount() {
    fetchCountryFig1('USA');
  }

  render() {
    const allData = {
      // WLD: { data: wldData, clampRight: undefined },
      // USA: { data: usData },
      // RUS: { data: rusData, clampRight: undefined }
    };
    return (
      <div className="App">
        <button
          onClick={() => this.setState({ country: "WLD" })}
          className={this.state.country === "WLD" ? "active" : undefined}
        >
          world
        </button>
        <button
          onClick={() => this.setState({ country: "USA" })}
          className={this.state.country === "USA" ? "active" : undefined}
        >
          usa
        </button>
        <button
          onClick={() => this.setState({ country: "RUS" })}
          className={this.state.country === "RUS" ? "active" : undefined}
        >
          russia
        </button>
        {false && (
          <SCCFigure
            data={allData[this.state.country].data}
            clamp={allData[this.state.country].clampRight}
            country={this.state.country}
          />
        )}
      </div>
    );
  }
}

export default App;
