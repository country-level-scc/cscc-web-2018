// @flow
import React, {Component} from 'react';
import ReactDOMServer from 'react-dom/server';

import {Fig1Options} from './SccFig1';
import {Fig2Options} from './SccFig2';
import {Fig4DataLoader, CsccFig4, Fig4Legend} from './SccFig4.js';
import {RCPS, DMGS, SSPS} from './constants';
import ParameterPicker from './param-picker';
import {saveAs} from 'file-saver';

import './App.css';

class App extends Component {
  state = {
    selectedCountry: 'WLD',
    page: 'winners',
  };

  componentDidMount() {
    if (
      window.location.hash !== '' &&
      ['#winners', '#cscc'].includes(window.location.hash)
    ) {
      this.setState({page: window.location.hash.substring(1)});
    }
  }

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
                  <div
                    style={{
                      display: 'flex',
                      flex: '1',
                      width: 800,
                      position: 'relative',
                      marginBottom: 40,
                    }}
                  >
                    <Fig4DataLoader {...state} ref={el => (this.bigFig4 = el)}>
                      {({data}) => (
                        <React.Fragment>
                          <CsccFig4
                            data={data}
                            onCountrySelect={fig4Data =>
                              this.setState({fig4Data})
                            }
                          />
                          <div style={{marginRight: 40}} />
                          <CsccFig4
                            width={150}
                            height={300}
                            xAxis={[0, 1, 2, 3, 4]}
                            yAxis={[-2, 0, 2, 4, 6]}
                            domainX={[-0.2, 4.2]}
                            domainY={[-2.5, 6.2]}
                            clip={true}
                            data={data}
                            onCountrySelect={fig4Data =>
                              this.setState({fig4Data})
                            }
                          />
                          <div style={{display: 'flex', flexFlow: 'column'}}>
                            <Fig4Legend />
                            {this.state.fig4Data && (
                              <div style={{marginTop: 12, display: 'flex', flexFlow: 'column'}}>
                              <div style={{marginLeft: 30, display: 'flex', alignItems: 'center', borderTop: '1px solid #999'}}>
                                <svg width={35} height={35} viewBox="0 0 35 35">
                                  <circle
                                    cx={17.5}
                                    cy={17.5}
                                    r={this.state.fig4Data.radius}
                                    fill={this.state.fig4Data.color}
                                    strokeWidth={1}
                                    stroke='#666'
                                  />
                                </svg>
                                <p>{this.state.fig4Data.label}</p>
                              </div>
                              <div className='fig4-detail'>
                                <p>SCC Per Capita: ${this.state.fig4Data.sccPerCapita.toFixed(3)}</p>
                                <p>SCC Share: {this.state.fig4Data.shareScc.toFixed(1)}%</p>
                                <p>Emissions Share: {this.state.fig4Data.shareEmissions.toFixed(1)}%</p>
                              </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      )}
                    </Fig4DataLoader>
                    <p className='fig4-x-axis-label'>Share of global emissions 2014 (%)</p>
                    <p className='fig4-y-axis-label'>Share of global social cost of carbon (%)</p>
                  </div>
                  {false && (
                    <button
                      onClick={() => {
                        if (this.bigFig4) {
                          const css = `
                          text {
                            font-family: helvetica;
                          }
                      `;
                          const cdataWrapper = () => ({
                            __html: `/* <![CDATA[ */ ${css} /* ]]> */`,
                          });

                          const Fig = () => (
                            <svg xmlns="http://www.w3.org/2000/svg">
                              <style dangerouslySetInnerHTML={cdataWrapper()} />
                              <CsccFig4 data={data} />
                            </svg>
                          );
                          const data = this.bigFig4.getData();
                          const svgText = ReactDOMServer.renderToStaticMarkup(
                            <Fig />,
                          );
                          const blob = new Blob(
                            [
                              `<?xml version="1.0" encoding="UTF-8" ?>${svgText}`,
                            ],
                            {type: 'image/svg+xml;charset=utf-8'},
                          );
                          saveAs(blob, 'figure4-ricke-et-al.svg');
                        }
                      }}
                    >
                      download figure
                    </button>
                  )}
                  <p className="caption">
                    Country-level shares of global SSC (i.e., CSCC/GSCC) versus
                    shares of 2013 CO2 emissions. CSCC is the median estimate
                    with growth adjusted discounting for {state.ssp}/{
                      RCPS.find(x => x.value === state.rcp).label
                    }, {DMGS.find(x => x.value === state.dmg).label} reference
                    specification (pooled countries). Bubble size corresponds to
                    the country’s GDP (log(USD)) and the color indicates
                    per-capita CSCC ($/MtCO2/person). Diagonal lines show the
                    ratio of global SCC share to emissions share. Ratios greater
                    than 1:1 indicate that a country’s share of global SSC
                    exceeds it share of global emission. Grey box in left panel
                    indicates the bounds of the detail shown in right panel.
                  </p>
                </React.Fragment>
              )}
            </ParameterPicker>
          </div>
        )}

        {page === 'cscc' && (
          <React.Fragment>
            <Fig2Options
              country={this.state.selectedCountry}
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
