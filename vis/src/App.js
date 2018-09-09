// @flow
import React, { Component } from "react";

import { Fig1Options } from "./SccFig1";
import { Fig2Options } from "./SccFig2";
import { Fig4DataLoader, CsccFig4 } from "./SccFig4.js";
import ParameterPicker from "./param-picker";

import "./App.css";

class App extends Component {
  state = {
    selectedCountry: "WLD"
  };

  render() {
    return (
      <div className="App">
        <ParameterPicker callback={state => console.log(state)}>
          {({ state }) => (
            <div style={{ display: "flex", marginBottom: 60 }}>
              <Fig4DataLoader {...state}>
                {({ data }) => <CsccFig4 data={data} />}
              </Fig4DataLoader>
              <div style={{ marginRight: 60 }} />
              <Fig4DataLoader {...state}>
                {({ data }) => (
                  <CsccFig4
                    width={150}
                    height={300}
                    xAxis={[0, 1, 2, 3, 4]}
                    yAxis={[-2, 0, 2, 4, 6]}
                    domainX={[-0.2, 4.2]}
                    domainY={[-2.5, 6.2]}
                    data={data}
                  />
                )}
              </Fig4DataLoader>
            </div>
          )}
        </ParameterPicker>

        {/* <CsccFig4
          data={[
            {
              ISO3: "USA",
              shareEmissions: 15.6,
              shareScc: 11.7,
              sccPerCapita: 0.3,
              logGdp: 10
            }
          ]}
        /> */}

        <Fig2Options
          onCountrySelect={selectedCountry =>
            this.setState({
              selectedCountry
            })
          }
        />
        <Fig1Options
          country={this.state.selectedCountry}
          onCountryChange={selectedCountry =>
            this.setState({ selectedCountry })
          }
        />
      </div>
    );
  }
}

export default App;
