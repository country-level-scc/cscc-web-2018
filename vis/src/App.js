// @flow
import React, {Component} from 'react';
import ReactDOMServer from 'react-dom/server';

import {Fig1Options} from './SccFig1';
import {Fig2Options} from './SccFig2';
import {Fig4DataLoader, CsccFig4, Fig4Legend, SccTable} from './SccFig4.js';
import {RCPS, DMGS, SSPS} from './constants';
import ParameterPicker from './param-picker';
import {saveAs} from 'file-saver';

import './App.css';

class App extends Component {
  state = {
    selectedCountry: 'WLD',
    page: '/winners',
    params: {
      ssp: 'SSP2',
      rcp: 'rcp60',
      dmg: 'bhm_sr',
      discounting: 'growth adjusted',
    },
  };

  queryParse(query = '') {
    return query
      .split('&')
      .map(pair => pair.split('='))
      .map(kv => kv.map(decodeURIComponent))
      .reduce((acc, curr) => {
        acc[curr[0]] = curr[1];
        return acc;
      }, {});
  }

  queryEncode(obj = {}) {
    return Object.keys(obj)
      .map(key => [key, obj[key]])
      .filter(kv => kv[1] !== undefined)
      .map(kv => kv.map(encodeURIComponent))
      .map(kv => kv.join('='))
      .join('&');
  }

  hashParse(hash) {
    if (hash.startsWith('#')) {
      const [path, query] = hash.substring(1).split('?');
      return {path, query: this.queryParse(query)};
    }
    return {path: '', query: {}};
  }

  handleHashChange = evt => {
    const {path, query} = this.hashParse(window.location.hash);

    // handle page change
    if (['/winners', '/cscc'].includes(path)) {
      if (this.state.page !== path) {
        this.setState({page: path});
      }
    }
  };

  nav = (pathStr, queryObj) => {
    // navigate to hash-path with queryObj and merge query object
    // same goes for path.
    const currentQuery = this.hashParse(window.location.hash).query;
    const query =
      queryObj == null ? currentQuery : {...currentQuery, ...queryObj};
    const querystring = this.queryEncode(query);
    const path =
      pathStr == null ? this.hashParse(window.location.hash).path : pathStr;

    window.location.hash = `${path}${
      querystring.length > 0 ? `?${querystring}` : ''
    }`;

    this.updateNavState(path, query);
  };

  updateNavState = (pathStr, queryObj) => {
    this.setState({
      page: pathStr,
      params: {
        ssp: queryObj.ssp,
        rcp: queryObj.rcp,
        dmg: queryObj.dmg,
        discounting: queryObj.discounting,
      },
      iso3: queryObj.iso3,
    });
  };

  componentDidMount() {
    const {path, query} = this.hashParse(window.location.hash);
    window.addEventListener('hashchange', this.handleHashChange);
    if (path === '') {
      this.nav(this.state.page, {...this.state.params, ...query});
    } else {
      this.updateNavState(path, query);
    }
  }

  render() {
    const {page} = this.state;
    return (
      <div className="App">
        <h1>Country-Level Social Cost of Carbon</h1>

        <div className="top-nav">
          <button
            className={page === '/winners' ? 'activeNavButton' : undefined}
            onClick={() => this.nav('/winners')}
          >
            ‘Winners’ &amp; ‘Losers’ among G20 nations.
          </button>
          <button
            className={page === '/cscc' ? 'activeNavButton' : undefined}
            onClick={() => this.nav('/cscc')}
          >
            Country-level social cost of carbon
          </button>
        </div>

        {page === '/winners' && (
          <div>
            <ParameterPicker
              onChange={({state}) => {
                this.nav(null, state);
              }}
              params={this.state.params}
            >
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
                    <Fig4DataLoader
                      {...state}
                      ref={el => (this.bigFig4 = el)}
                      iso3={this.state.iso3}
                      onChange={({countryData}) => {
                        console.log({countryData});
                        this.state.iso3 &&
                          this.setState({fig4Data: countryData});
                      }}
                    >
                      {({data}) => (
                        <React.Fragment>
                          <CsccFig4
                            data={data}
                            onCountrySelect={
                              fig4Data => {
                                this.nav(null, {iso3: fig4Data.ISO3});
                                this.setState({fig4Data});
                              }
                              // this.setState({fig4Data})
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
                            onCountrySelect={fig4Data => {
                              this.nav(null, {iso3: fig4Data.ISO3});
                              this.setState({fig4Data});
                            }}
                          />
                          <div style={{display: 'flex', flexFlow: 'column'}}>
                            <Fig4Legend />
                            {this.state.fig4Data && (
                              <div
                                style={{
                                  marginTop: 12,
                                  display: 'flex',
                                  flexFlow: 'column',
                                }}
                              >
                                <div
                                  style={{
                                    marginLeft: 30,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderTop: '1px solid #999',
                                  }}
                                >
                                  <svg
                                    width={35}
                                    height={35}
                                    viewBox="0 0 35 35"
                                  >
                                    <circle
                                      cx={17.5}
                                      cy={17.5}
                                      r={this.state.fig4Data.radius}
                                      fill={this.state.fig4Data.color}
                                      strokeWidth={1}
                                      stroke="#666"
                                    />
                                  </svg>
                                  <p>{this.state.fig4Data.label}</p>
                                </div>
                                <div className="fig4-detail">
                                  <SccTable row={this.state.fig4Data} />
                                  <p>
                                    SCC Per Capita: ${this.state.fig4Data.sccPerCapita.toFixed(
                                      3,
                                    )}
                                  </p>
                                  <p>
                                    SCC Share:{' '}
                                    {this.state.fig4Data.shareScc.toFixed(1)}%
                                  </p>
                                  <p>
                                    Emissions Share:{' '}
                                    {this.state.fig4Data.shareEmissions.toFixed(
                                      1,
                                    )}%
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      )}
                    </Fig4DataLoader>
                    <p className="fig4-x-axis-label">
                      Share of global emissions 2014 (%)
                    </p>
                    <p className="fig4-y-axis-label">
                      Share of global social cost of carbon (%)
                    </p>
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

        {page === '/cscc' && (
          <React.Fragment>
            <Fig2Options
              country={this.state.iso3}
              onCountrySelect={iso3 => {
                // this.setState({
                //                 iso3,
                //               });
                this.nav(null, {iso3: iso3});
              }}
              params={this.state.params}
              onParamChange={({state}) => {
                this.nav(null, state);
              }}
            />
            <Fig1Options
              country={this.state.iso3}
              onCountryChange={selectedCountry => {
                this.setState({selectedCountry});
                this.nav(null, {iso3: selectedCountry});
              }}
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
