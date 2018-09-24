// @flow

import * as React from 'react';

import {geoNaturalEarth1, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import map from './ne_110_topo_quant.json';
import {schemeRdYlBu} from 'd3-scale-chromatic';
import CSVLoader from './csv-loader';
import ParameterPicker from './param-picker';
import {RCPS, DMGS} from './constants'

const projection = geoNaturalEarth1()
  .scale(100)
  .translate([800 / 2, 275 / 2])
const worldMap = feature(map, map.objects.countries).features;

type Props = {
  data: Array<{}>,
  ssp?: string,
  rcp?: string,
  dmg?: string,
  onCountryEnter: (name: string, data: {}) => any,
};

class Figure2 extends React.Component<Props> {
  render() {
    const {data} = this.props;

    return (
      <svg width={800} height={250} viewBox="150 0 800 250">
        <g transform={`translate(675, 0)`}>
          ><Fig2Legend bins={fig2Bins} labels={{0: '<-10', 7: '>100'}} />
        </g>
        <g className="countries">
          {worldMap.map(country => {
            // access feature metadata via country.properties
            const {
              properties: {label, id},
            } = country;
            const countryRow = data.find(row => row.ISO3 === id);

            return (
              <path
                key={label}
                label={label}
                stroke="#ccc"
                d={geoPath().projection(projection)(country)}
                fill={colorFor(countryRow)}
                onMouseEnter={() =>
                  this.props.onCountryEnter &&
                  this.props.onCountryEnter(label, countryRow)
                }
                style={{cursor: 'pointer'}}
                onClick={() => this.props.onCountryClick(id)}
              />
            );
          })}
        </g>
      </svg>
    );
  }
}

type CSVFig2Props = {
  ssp: string,
  rcp: string,
  dmg: string,
  csvPath?: string,
};
type CSVFig2State = {
  data: Array<{}>,
  loading: boolean,
};

const colorFor = row => {
  if (row) {
    const index = binner(row['50%'], true);
    if (index > -1) {
      return schemeRdYlBu[11][index + 0];
    }
  }
  return '#eee';
};

const fig2Bins = [
  [-1000, -10],
  [-10, -1],
  [-1, 0],
  [0, 1],
  [1, 10],
  [10, 50],
  [50, 100],
  [100, 100000],
];
const binner = (val, invert = false, bins = fig2Bins) => {
  const indices = bins.map(([min, max]) => val > min && val <= max);
  const pos = indices.indexOf(true);
  return invert ? bins.length - pos : pos;
};

const Fig2Legend = ({bins, labels, size = 15, x, y}) => {
  const height = (size + 1) * bins.length;
  return bins.map((bin, idx) => {
    return (
      <React.Fragment key={bin[0]}>
        <rect
          fill={colorFor({'50%': (bin[0] + bin[1]) / 2})}
          width={size}
          height={size}
          x={0}
          y={idx * (size + 1)}
        />
        <text
          className="f2-legend-label"
          x={size + 2}
          y={idx * (size + 1) + 10}
        >
          {labels[idx] !== undefined ? labels[idx] : `${bin[0]} – ${bin[1]}`}
        </text>
      </React.Fragment>
    );
  });
};

type ParamProps = {
  onCountrySelect: (iso3: string) => any,
};
type ParamState = {
  ssp: 'SSP1' | 'SSP2' | 'SSP3' | 'SSP4' | 'SSP5',
  rcp: 'rcp45' | 'rcp60' | 'rcp85',
  dmg: 'bhm_sr' | 'bhm_richpoor_sr' | 'bhm_lr' | 'bhm_richpoor_lr' | 'djo',
  hoveredName?: string,
  hoveredData?: {},
};

export class Fig2Options extends React.Component<ParamProps, ParamState> {
  state = {
    ssp: 'SSP2',
    rcp: 'rcp60',
    dmg: 'bhm_sr',
  };
  update = evt => {
    this.setState({[evt.currentTarget.name]: evt.currentTarget.value});
  };

  static fixedDiscounting(row: { prtp: string }) {
    return (
      row.prtp !== "2" &&
      row.dmgfuncpar === "bootstrap" &&
      row.climate === "uncertain"
    );
  }

  static growthAdjustedDiscounting(row: { prtp: string }) {
    return (
      row.prtp === "2" &&
      row.dmgfuncpar === "bootstrap" &&
      row.climate === "uncertain"
    );
  }

  render() {
    const ssps = ['SSP1', 'SSP2', 'SSP3', 'SSP4', 'SSP5'];
    const rcps = ['rcp45', 'rcp60', 'rcp85'];
    const dmgs = [
      'bhm_sr',
      'bhm_richpoor_sr',
      'bhm_lr',
      'bhm_richpoor_lr',
      'djo',
    ];

    const {hoveredData} = this.state;

    return (
      <div>
        <ParameterPicker>
          {({state: {rcp, ssp, dmg, discounting}}) => (
            <CSVLoader
              csvPath={`${process.env.PUBLIC_URL}/rcp_${rcp}_dmg_${
                dmg
              }_ssp_${ssp}.csv`}
              test={discounting === 'fixed' ? Fig2Options.fixedDiscounting : Fig2Options.growthAdjustedDiscounting}
            >
              {({data, loading}) => (
                <div className={loading ? 'loading-map' : undefined}>
                  <Figure2
                    data={data}
                    onCountryEnter={this.hoverCountry}
                    onCountryClick={this.props.onCountrySelect}
                  />
                              <p className="caption">
            Spatial distribution of
            median estimates of the CSCC computed for the reference case of scenario{' '}
            {ssp}/{RCPS.find(x => x.value === rcp).label}, {DMGS.find(x => x.value === dmg).label} impact function ({dmg}), and a{' '}
            {discounting === 'fixed' ? 'fixed discount rate' : 'growth adjusted discount rate with 2% pure rate of time preference and IES of 1.5'}.
            </p>

                </div>
              )}
            </CSVLoader>
          )}
        </ParameterPicker>

        <div
          className="f2-country-detail"
          style={{borderTop: `3px solid ${colorFor(hoveredData)}`}}
        >
          <p className="f2-countryname">
            <strong>
              {this.state.hoveredName}{' '}
              {hoveredData &&
                hoveredData.ISO3 && (
                  <button
                    onClick={() => this.props.onCountrySelect(hoveredData.ISO3)}
                  >
                    👇
                  </button>
                )}
            </strong>
          </p>
          {hoveredData ? (
            <React.Fragment>
              <p>
                <span className="f2-clscc">
                  16.3%: {hoveredData && fmt(hoveredData['16.7%'])}
                </span>
                <span className="f2-clscc">
                  50%: {hoveredData && fmt(hoveredData['50%'])}
                </span>
                <span className="f2-clscc">
                  83.3%: {hoveredData && fmt(hoveredData['83.3%'])}
                </span>
              </p>
              <p className="f2-clscc">
                in USD/tCO
                <sub>2</sub>
              </p>
            </React.Fragment>
          ) : (
            this.state.hoveredName && (
              <p className="f2-nodata">No data available</p>
            )
          )}
        </div>
      </div>
    );
  }
  hoverCountry = (hoveredName: string, hoveredData: {}) => {
    this.setState({
      hoveredName,
      hoveredData,
    });
  };
}

const fmt = val => typeof val === 'number' && Math.floor(val * 1000) / 1000;

export default Figure2;

// rcp, ssp, dmdfn
