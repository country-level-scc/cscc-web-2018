// @flow

import * as React from "react";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import map from "./ne_110_topo_quant.json";
import { schemeRdYlBu } from "d3-scale-chromatic";

import Papa from "papaparse";

const projection = geoNaturalEarth1()
  .scale(100)
  .translate([800 / 2, 450 / 2]);
const worldMap = feature(map, map.objects.countries).features;

type Props = {
  data: Array<{}>,
  ssp?: string,
  rcp?: string,
  dmg?: string,
  onCountryEnter: (name: string, data: {}) => any
};

class Figure2 extends React.Component<Props> {
  render() {
    const { data } = this.props;

    return (
      <svg width={800} height={350} viewBox="150 0 800 350">
        <g transform={`translate(675, 75)`}>
          ><Fig2Legend bins={fig2Bins} labels={{ 0: "<-10", 7: ">100" }} />
        </g>
        <g className="countries">
          {worldMap.map(country => {
            // access feature metadata via country.properties
            const {
              properties: { label, id }
            } = country;
            const countryRow = data.filter(row => row.ISO3 === id)[0];

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
  csvPath?: string
};
type CSVFig2State = {
  data: Array<{}>,
  loading: boolean
};

class CSVFig2Loader extends React.PureComponent<CSVFig2Props, CSVFig2State> {
  state = {
    data: [],
    loading: false
  };
  static defaultProps = {
    csvPath: `${process.env.PUBLIC_URL}/cscc_v1.csv`,
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr",
    prtp: "2",
    eta: "1p5",
    dmgfuncpar: "bootstrap",
    climate: "uncertain"
  };

  fetchData = () => {
    const data = [];
    const { ssp, rcp, dmg, prtp, eta, dmgfuncpar, climate } = this.props;
    const test = row =>
      row.SSP === ssp &&
      row.RCP === rcp &&
      row.run === dmg &&
      row.prtp === prtp &&
      row.eta === eta &&
      row.dmgfuncpar === dmgfuncpar &&
      row.climate === climate;
    this.setState({ loading: true });
    Papa.parse(this.props.csvPath, {
      download: true,
      header: true,
      dynamicTyping: name => ["16.7%", "50%", "83.3%"].includes(name),
      step: (results, parser) => {
        const row = results.data[0];
        if (test(row)) {
          data.push(row);
        }
      },
      complete: () => {
        this.setState({ data, loading: false });
      }
    });
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.ssp !== this.props.ssp ||
      prevProps.rcp !== this.props.rcp ||
      prevProps.dmg !== this.props.dmg
    ) {
      this.fetchData();
    }
  }

  render() {
    const { loading, data } = this.state;
    return this.props.children({ data, loading });
  }
}

const colorFor = row => {
  if (row) {
    const index = binner(row["50%"], true);
    if (index > -1) {
      return schemeRdYlBu[11][index + 0];
    }
  }
  return "#eee";
};

const fig2Bins = [
  [-1000, -10],
  [-10, -1],
  [-1, 0],
  [0, 1],
  [1, 10],
  [10, 50],
  [50, 100],
  [100, 100000]
];
const binner = (val, invert = false, bins = fig2Bins) => {
  const indices = bins.map(([min, max]) => val > min && val <= max);
  const pos = indices.indexOf(true);
  return invert ? bins.length - pos : pos;
};

const Fig2Legend = ({ bins, labels, size = 15, x, y }) => {
  const height = (size + 1) * bins.length;
  return bins.map((bin, idx) => {
    return (
      <React.Fragment key={bin[0]}>
        <rect
          fill={colorFor({ "50%": (bin[0] + bin[1]) / 2 })}
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

type ParamProps = {};
type ParamState = {
  ssp: "SSP1" | "SSP2" | "SSP3" | "SSP4" | "SSP5",
  rcp: "rcp45" | "rcp60" | "rcp85",
  dmg: "bhm_sr" | "bhm_richpoor_sr" | "bhm_lr" | "bhm_richpoor_lr" | "djo",
  hoveredName?: string,
  hoveredData?: {}
};

export class Fig2Options extends React.Component<ParamProps, ParamState> {
  state = {
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr"
  };
  update = evt => {
    this.setState({ [evt.currentTarget.name]: evt.currentTarget.value });
  };
  render() {
    const ssps = ["SSP1", "SSP2", "SSP3", "SSP4", "SSP5"];
    const rcps = ["rcp45", "rcp60", "rcp85"];
    const dmgs = [
      "bhm_sr",
      "bhm_richpoor_sr",
      "bhm_lr",
      "bhm_richpoor_lr",
      "djo"
    ];

    const { hoveredData } = this.state;

    return (
      <div>
        <div>
          <select name="ssp" onChange={this.update}>
            {ssps.map(ssp => (
              <option key={ssp} value={ssp}>
                {ssp}
              </option>
            ))}
          </select>
          <select name="rcp" onChange={this.update}>
            {rcps.map(ssp => (
              <option key={ssp} value={ssp}>
                {ssp}
              </option>
            ))}
          </select>
          <select name="dmg" onChange={this.update}>
            {dmgs.map(ssp => (
              <option key={ssp} value={ssp}>
                {ssp}
              </option>
            ))}
          </select>
        </div>
        <CSVFig2Loader
          ssp={this.state.ssp}
          dmg={this.state.dmg}
          rcp={this.state.rcp}
        >
          {({ data, loading }) => (
            <div className={loading ? "loading-map" : undefined}>
              <Figure2 data={data} onCountryEnter={this.hoverCountry} />
            </div>
          )}
        </CSVFig2Loader>

        <div
          className="f2-country-detail"
          style={{ borderTop: `3px solid ${colorFor(hoveredData)}` }}
        >
          <p className="f2-countryname">
            <strong>{this.state.hoveredName}</strong>
          </p>
          {hoveredData ? (
            <React.Fragment>
              <p>
                <span className="f2-clscc">
                  16.3%: {hoveredData && fmt(hoveredData["16.7%"])}
                </span>
                <span className="f2-clscc">
                  50%: {hoveredData && fmt(hoveredData["50%"])}
                </span>
                <span className="f2-clscc">
                  83.3%: {hoveredData && fmt(hoveredData["83.3%"])}
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
      hoveredData
    });
  };
}

const fmt = val => typeof val === "number" && Math.floor(val * 1000) / 1000;

export default Figure2;

// rcp, ssp, dmdfn
