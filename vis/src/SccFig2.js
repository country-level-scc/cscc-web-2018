// @flow

import * as React from "react";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import map from "./ne_110_topo_quant.json";
import { schemeRdYlBu } from "d3-scale-chromatic";

import Papa from "papaparse";

type Props = {
  data: Array<{}>,
  ssp?: string,
  rcp?: string,
  dmg?: string
};

class Figure2 extends React.Component<Props> {
  render() {
    const { data } = this.props;
    const worldMap = feature(map, map.objects.countries).features;
    const projection = geoNaturalEarth1()
      .scale(100)
      .translate([800 / 2, 450 / 2]);
    return (
      <svg width={800} height={450} viewBox="0 0 800 450">
        <g className="countries">
          {worldMap.map((country, index) => {
            // console.log(data)
            // access metadata via data.properties
            return (
              <path
                key={country.properties.id}
                id={country.properties.id}
                stroke="#bbb"
                d={geoPath().projection(projection)(country)}
                fill={colorFor(country.properties.id, data)}
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
  data: Array<{}>
};

class CSVFig2 extends React.Component<CSVFig2Props, CSVFig2State> {
  state = {
    data: []
  };
  static defaultProps = {
    csvPath: `${process.env.PUBLIC_URL}/cscc_v1.csv`,
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr",
    prtp: "2",
    eta: "1p5",
    dmgfuncpar: 'bootstrap',
    climate: 'uncertain'
  };

  componentDidMount() {
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
    Papa.parse(this.props.csvPath, {
      download: true,
      header: true,
      dynamicTyping: name => ["16.7%", "50%", "83.3%"].includes(name),
      step: (results, parser) => {
        const row = results.data[0];
        // console.log(row);
        if (test(row)) {
          console.log(row)
          data.push(row);
        }
      },
      complete: () => {
        this.setState({ data });
      }
    });
  }

  render() {
    console.log(this.state.data.map(r => ({iso: r.ISO3, median: r['50%']})))
    return <Figure2 data={this.state.data} />;
  }
}

const colorFor = (iso3, data) => {
  const row = data.filter(row => row.ISO3 === iso3)[0];
  if (row) {
    const index = binner(row["50%"], true);
    if (index > -1) {
      return schemeRdYlBu[11][index+0];
    }
  }
  return "#eee";
};

const binner = (val, invert=false) => {
  const bins = [[-1000, -10], [-10, -1], [-1, 0], [0, 1], [1, 10], [10, 50], [50, 100], [100, 100000]];
  const indices = bins.map(([min, max]) => val > min && val <= max);
  const pos = indices.indexOf(true);
  return invert ? (bins.length - pos) : pos;
};

export default CSVFig2;

// rcp, ssp, dmdfn
