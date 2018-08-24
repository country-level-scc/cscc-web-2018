// @flow
import React, { Component } from "react";

import SCCFigure from "./SccFig1";

import wldData from "./wld_data";
import usData from "./usa_data";
import rusData from "./rus_data";

import "./App.css";

class App extends Component {
  state = { country: "WLD" };
  render() {
    const allData = {
      WLD: { data: wldData, clampRight: undefined },
      USA: { data: usData },
      RUS: { data: rusData, clampRight: undefined }
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
        <SCCFigure
          data={allData[this.state.country].data}
          clamp={allData[this.state.country].clampRight}
          country={this.state.country}
        />
      </div>
    );
  }
}

export default App;
