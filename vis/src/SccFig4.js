// @flow

import * as React from 'react';
import {scaleLinear, scaleDiverging} from 'd3-scale';
import {interpolateRdBu} from 'd3-scale-chromatic';
// import _range from 'lodash/range';
// import {Motion, spring} from 'react-motion';

import CSVLoader from './csv-loader.js';

export class CSVCsccFig4 extends React.PureComponent<*, *> {
  static defaultProps = {
    ssp: 'SSP2',
    rcp: 'rpp60',
    dmg: 'bhm_sr',
  };

  render() {
    const {width, height} = this.props;
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
    domainX: [0, 40],
    domainY: [-10, 30],
  };

  render() {
    const {width, height, domainX, domainY} = this.props;
    // both input domain and ranges are specified as in paper
    const scaleX = scaleLinear()
      .domain(domainX)
      .range([0, width]);
    const scaleY = scaleLinear()
      .domain(domainY)
      .range([0, height]);
    const scaleR = scaleLinear()
      .domain([0, 20])
      .range([0, 5])

    const color = scaleDiverging(interpolateRdBu)
      .domain([-0.25, 0, 0.5])
      .clamp(true);

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {this.props.data.map(row => {
          return (
            <circle
              key={row.ISO3}
              cx={scaleX(row.shareEmissions)}
              cy={scaleY(row.shareScc)}
              fill={color(-1 * row.sccPerCapita)}
              r={scaleR(row.logGdp)}
              strokeWidth={1}
              stroke="#444"
            />
          );
        })}
      </svg>
    );
  }
}
