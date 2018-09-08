// @flow

import * as React from "react";
import { scaleLinear, scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";

import CSVLoader from "./csv-loader.js";

export class CSVCsccFig4 extends React.PureComponent<*, *> {
  static defaultProps = {
    ssp: "SSP2",
    rcp: "rpp60",
    dmg: "bhm_sr"
  };

  render() {
    const { width, height } = this.props;
    const test = row =>
      row.rcp === this.props.rcp &&
      row.ssp === this.props.ssp &&
      row.dmg === this.props.dmg;
    return (
      <CSVLoader test={test}>
        {(data, loading) => <CsccFig4 data={data} />}
      </CSVLoader>
    );
  }
}

export class CsccFig4 extends React.Component<*, *> {
  static defaultProps = {
    width: 400,
    height: 300,
    data: [],
    domainX: [-1, 32],
    domainY: [-4, 23]
  };

  render() {
    const { width, height, domainX, domainY } = this.props;
    // both input domain and ranges are specified as in paper
    const scaleX = scaleLinear()
      .domain(domainX)
      .range([0, width]);
    const scaleY = scaleLinear() // invert axes
      .domain(domainY)
      .range([height, 0]);
    const scaleR = scaleLinear()
      .domain([0, 20])
      .range([0, scaleX(4)]);

    const color = scaleDiverging(interpolateRdBu)
      .domain([-0.25, 0, 0.5])
      .clamp(true);

    return (
      <svg
        width={width}
        height={height}
        viewBox={`-30 -30 ${width + 60} ${height + 60}`}
        style={{ border: "1px solid #ccc" }}
      >
        <Fig4Axes
          domainX={domainX}
          domainY={domainY}
          scaleX={scaleX.clamp(true)}
          scaleY={scaleY.clamp(true)}
        />
        {this.props.data.map(row => {
          return (
            <circle
              key={row.ISO3}
              cx={scaleX(row.shareEmissions)}
              cy={scaleY(row.shareScc)}
              fill={color(-0.75 * row.sccPerCapita)}
              r={scaleR(row.logGdp / 2)}
              strokeWidth={1}
              stroke="#444"
            />
          );
        })}
      </svg>
    );
  }
}

const Fig4Axes = ({ domainX, domainY, scaleX, scaleY }) => {
  return (
    <g>
      <rect
        x={scaleX(domainX[0])}
        y={scaleY(domainY[1])}
        width={scaleX(domainX[1] - domainX[0])}
        height={scaleY(domainY[0]) - scaleY(domainY[1])}
        fill="transparent"
        stroke="#ccc"
        strokeWidth={1}
      />
      {[0, 10, 20, 30].map(x => (
        <line
          x1={scaleX(x)}
          x2={scaleX(x)}
          y1={scaleY(40)}
          y2={scaleY(-20)}
          stroke="#ddd"
          strokeWidth={1}
        />
      ))}
      {[-5, 0, 5, 10, 15, 20].map(y => (
        <line
          x1={scaleX(-20)}
          x2={scaleX(40)}
          y1={scaleY(y)}
          y2={scaleY(y)}
          stroke="#ddd"
          strokeWidth={1}
        />
      ))}
      <SlopeLines
        domainX={domainX}
        domainY={domainY}
        scaleX={scaleX}
        scaleY={scaleY}
        slopes={[
          [4, 1],
          [2, 1],
          [1, 1],
          [1, 2],
          [1, 4],
          [1, -4],
          [1, -2],
          [1, -1],
          [2, -1]
        ]}
      />
    </g>
  );
};

const SlopeLines = ({ scaleX, scaleY, domainX, domainY, slopes }) => (
  <React.Fragment>
    {slopes.map(([y, x]) => {
      const m = y / x;
      const yInt = x > 0 ? (x === 1 ? domainY[1] : m * domainX[1]) : domainY[0];
      const xInt = x === 2 || x === 4 ? domainX[1] : yInt / m;
      return (
        <line
          id={`${x}:${y}`}
          x1={scaleX(0)}
          y1={scaleY(0)}
          x2={scaleX(xInt)}
          y2={scaleY(yInt)}
          strokeWidth={1}
          stroke={x === y ? "#aaa" : "#eee"}
        />
      );
    })}
  </React.Fragment>
);
