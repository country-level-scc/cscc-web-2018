// @flow
import React, {Component} from 'react';
import ReactDOMServer from 'react-dom/server';

import {Fig1Options} from './SccFig1';
import {Fig2Options} from './SccFig2';
import {Fig4DataLoader, CsccFig4} from './SccFig4.js';
import {RCPS, DMGS, SSPS} from './constants';
import ParameterPicker from './param-picker';
import {saveAs} from 'file-saver';

import './App.css';

class App extends Component {
  state = {
    selectedCountry: 'WLD',
    page: 'winners',
  };

  render() {
    const {page} = this.state;
    return (
      <div className="App">
        <h1>Country-Level Social Cost of Carbon</h1>

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
                  <div style={{display: 'flex', marginBottom: 20}}>
                    <Fig4DataLoader {...state} ref={el => this.bigFig4 = el}>
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
                  {false && <button onClick={() => {
                    if (this.bigFig4) {
                      const css = `
                          text {
                            font-family: helvetica;
                          }
                      `;
                      const cdataWrapper = () => ({__html: `/* <![CDATA[ */ ${css} /* ]]> */`});

                      const Fig = () => <svg xmlns="http://www.w3.org/2000/svg">
                        <style dangerouslySetInnerHTML={cdataWrapper()} />
                        <CsccFig4 data={data}/>
                      </svg>
                      const data = this.bigFig4.getData();
                      const svgText = ReactDOMServer.renderToStaticMarkup(<Fig />);
                      const blob = new Blob([`<?xml version="1.0" encoding="UTF-8" ?>${svgText}`], {type:"image/svg+xml;charset=utf-8"})
                      saveAs(blob, 'figure4-ricke-et-al.svg')
                    }
                  }}>download figure</button>}
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
