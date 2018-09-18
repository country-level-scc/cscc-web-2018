// @flow
import React, {Component} from 'react';

import {Fig1Options} from './SccFig1';
import {Fig2Options} from './SccFig2';
import {Fig4DataLoader, CsccFig4} from './SccFig4.js';
import {RCPS, DMGS, SSPS} from './constants';
import ParameterPicker from './param-picker';

import './App.css';

class App extends Component {
  state = {
    selectedCountry: 'WLD',
    page: 'cscc',
  };

  render() {
    const {page} = this.state;
    return (
      <div className="App">
        <h1>Social Cost of Carbon</h1>

        <div className="top-nav">
          <button
            className={page === 'winners' ? 'activeNavButton' : undefined}
            onClick={() => this.setState({page: 'winners'})}
          >
            ‘Winners’ &amp; ‘Losers’ among G20 nations.
          </button>
          <button
            className={page === 'cscc' ? 'activeNavButton' : undefined}
            onClick={() => this.setState({page: 'cscc'})}
          >
            Country-level social cost of carbon
          </button>
        </div>

        {page === 'winners' && (
          <div>
            <ParameterPicker>
              {({state}) => (
                <React.Fragment>
                  <div style={{display: 'flex', marginBottom: 60}}>
                    <Fig4DataLoader {...state}>
                      {({data}) => <CsccFig4 data={data} />}
                    </Fig4DataLoader>
                    <div style={{marginRight: 60}} />
                    <Fig4DataLoader {...state}>
                      {({data}) => (
                        <CsccFig4
                          width={150}
                          height={300}
                          xAxis={[0, 1, 2, 3, 4]}
                          yAxis={[-2, 0, 2, 4, 6]}
                          domainX={[-0.2, 4.2]}
                          domainY={[-2.5, 6.2]}
                          clip={true}
                          data={data}
                        />
                      )}
                    </Fig4DataLoader>
                  </div>
                  <p className="caption">
                    Country-level shares of global SSC (i.e., CSCC/GSCC) versus
                    shares of 2013 CO2 emissions. CSCC is the median estimate
                    with growth adjusted discounting for {state.ssp}/{RCPS.find(x => x.value === state.rcp).label}, {DMGS.find(x => x.value ===state.dmg).label}{' '}
                    reference specification (pooled countries).
                    Bubble size corresponds to the country’s GDP (log(USD)) and
                    the color indicates per-capita CSCC ($/MtCO2/person).
                    Diagonal lines show the ratio of global SCC share to
                    emissions share. Ratios greater than 1:1 indicate that a
                    country’s share of global SSC exceeds it share of global
                    emission. Grey box in left panel indicates the bounds of the
                    detail shown in right panel.
                  </p>
                </React.Fragment>
              )}
            </ParameterPicker>
          </div>
        )}

        {page === 'cscc' && (
          <React.Fragment>
            <Fig2Options
              onCountrySelect={selectedCountry =>
                this.setState({
                  selectedCountry,
                })
              }
            />
            <Fig1Options
              country={this.state.selectedCountry}
              onCountryChange={selectedCountry =>
                this.setState({selectedCountry})
              }
              width={800}
              height={540}
              paddingY={20}
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default App;
