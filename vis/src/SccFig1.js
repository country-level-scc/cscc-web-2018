// @flow
import * as React from 'react';
import {scaleLinear} from 'd3-scale';
import _range from 'lodash/range';
import {Motion, spring} from 'react-motion';
import CSVLoader from './csv-loader';
import {CountryNamePicker} from './country-picker';

import {SSPS, RCPS} from './constants';

type SSP = 'SSP1' | 'SSP2' | 'SSP3' | 'SSP4' | 'SSP5';
type RCP = 'rcp45' | 'rcp60' | 'rcp85';
type DMG = 'bhm_sr' | 'bhm_richpoor_sr' | 'bhm_lr' | 'bhm_richpoor_lr' | 'djo';
type CSVRow = {|
  run: DMG,
  dmgfuncpar: string,
  climate: 'expected' | 'uncertain',
  SSP: SSP,
  RCP: RCP,
  N: *,
  ISO3: string,
  prtp: '1p5',
  eta: '2',
  dr: 'NA' | '3',
  '16.7%': number,
  '50%': number,
  '83.3%': number,
|};

const dataForParams = (data: Array<CSVRow>, ssp: SSP, rcp: RCP) =>
  data
    .filter(row => row.SSP === ssp)
    .filter(row => row.RCP === rcp)
    .reduce(
      (prev, curr) => ({
        ...prev,
        [curr.run]: curr,
      }),
      {},
    );

const Scales = ({minX, maxX, scaler, height, slices = 5}) => {
  const sliceWidth = Math.floor((maxX - minX) / slices);
  let ticks = _range(Math.floor(minX), Math.ceil(maxX), sliceWidth);

  if (Math.floor(minX) < 0) {
    ticks.push(0)
    ticks = ticks.sort((a, b) => a-b)
  }
  return (
    <g>
      <line x1={1} x2={1} y1={0} y2={height} stroke="#aaa" />
      <line y1={height} y2={height} stroke="#aaa" x1={1} x2={scaler(maxX)} />
      {ticks.map((t, idx) => (
        <Motion key={idx} defaultStyle={{x: 0}} style={{x: spring(scaler(t))}}>
          {values => (
            <React.Fragment>
              <line
                x1={values.x}
                x2={values.x}
                y1={t === 0 ? 0 : height - 3}
                y2={height}
                stroke="#aaa"
              />
              {t !== 0 && <text
                className="tickLabel"
                x={values.x}
                y={height + 10}
                textAnchor="middle"
              >
                {Number(t).toLocaleString()}
              </text>}
            </React.Fragment>
          )}
        </Motion>
      ))}
    </g>
  );
};

const minMax = (data: Array<CSVRow>): {max: number, min: number} => {
  let min = 0,
    max = 0;
  data.forEach(row => {
    const d = [row['16.7%'], row['83.3%']];
    min = min ? Math.min(min, ...d) : Math.min(...d);
    max = max ? Math.max(max, ...d) : Math.max(...d);
  });
  return {min, max};
};

const inferredClamp = (data: Array<CSVRow>) => {
  const slice = data
    .filter(row => row.RCP === 'rcp60')
    .filter(row => row.SSP === 'SSP2')
    .filter(row => row.run === 'bhm_sr');
  if (slice.length === 1) {
    return (slice[0]['83.3%'] - slice[0]['16.7%']) * 20;
  } else {
    // return 10k as default if this fails (which should error out)
    // console.log(`unable to find a max bounds for ${data[0] && data[0].ISO3}`);
    return 10000;
  }
};

type Fig1Props = {
  country: string,
  data: *,
  clamp?: number,
};

class SCCFigure extends React.Component<Fig1Props> {
  static defaultProps = {
    width: 400,
    height: 300,
  };
  render() {
    const {country, data, clamp, width, height, paddingY = 35} = this.props;
    const {min, max} = minMax(data);
    const inferred = inferredClamp(data);
    const maxActual = clamp !== undefined ? clamp : Math.min(inferred, max);

    const paddingLeft = 200;
    const scaler = scaleLinear()
      .clamp(true) // clamp b/c values may be negative
      .domain([min, maxActual])
      .range([10, width - paddingLeft - 5]);

    const rowHeight = (height - (SSPS.length - 1) * paddingY) / SSPS.length;
    const rowOffest = rowHeight + paddingY;

    return (
      <svg
        viewBox={`-${paddingLeft} -5 ${width + 100} ${height + 30}`}
        width={width}
        height={height}
      >
        {SSPS.map(({value: ssp}, i) => {
          const startY = i * rowOffest + 5;
          return (
            <g key={ssp} transform={`translate(0,${startY})`}>
              <DamageGroup
                ssp={ssp}
                data={data}
                scaler={scaler}
                height={rowHeight}
              />
              <text
                className="fig1-major-y-label"
                y={rowHeight / 2 - 9}
                x={-50}
                textAnchor="end"
                style={{fontSize: 14, width: 40}}
              >
                {sspLabels[ssp]}
              </text>
            </g>
          );
        })}
        <Scales minX={min} maxX={maxActual} height={height} scaler={scaler} />

        <text
          className="fig1-attr"
          x={width - paddingLeft}
          y={height + 40}
          textAnchor="end"
        >
          Ricke et al. Country-level social cost of carbon. (2018).
        </text>
      </svg>
    );
  }
}

const sspLabels = {
  SSP1: 'Sustainability',
  SSP2: (
    <React.Fragment>
      <tspan textAnchor="end" x={-50} y="1em">
        Middle
      </tspan>
      <tspan textAnchor="end" x={-50} dy="1.3em">
        of the
      </tspan>
      <tspan textAnchor="end" x={-50} dy="1.3em">
        Road
      </tspan>
    </React.Fragment>
  ),
  SSP3: (
    <React.Fragment>
      <tspan textAnchor="end" x={-50}>
        Regional
      </tspan>
      <tspan textAnchor="end" x={-50} dy="1.3em">
        Rivalry
      </tspan>
    </React.Fragment>
  ),
  SSP4: 'Inequality',
  SSP5: (
    <React.Fragment>
      <tspan textAnchor="end" x={-50}>
        Fossil-fueled
      </tspan>
      <tspan textAnchor="end" x={-50} dy="1.3em">
        Development
      </tspan>
    </React.Fragment>
  ),
};

export default SCCFigure;

const DamageGroup = ({ssp, data, scaler, height}) => {
  const rcpRowHeight = height / RCPS.length;
  return RCPS.map(({value: rcp, label}, j) => (
    <g
      key={rcp}
      transform={`translate(0,${j * rcpRowHeight})`}
      // onMouseEnter={() => console.log({ rcp, ssp })}
      className={[rcp, ssp, 'scc'].join(' ')}
    >
      <DamageFigure
        rcp={rcp}
        ssp={ssp}
        data={dataForParams(data, ssp, rcp)}
        scaler={scaler}
        height={rcpRowHeight}
      />
      <text x={-2} y={4} textAnchor="end" strokeWidth={0} className="rcpLabel">
        {label}
      </text>
      <line x1={1} y1={2} x2={4} y2={2} strokeWidth={1} stroke="#aaa" />
    </g>
  ));
};

type Props = {
  rcp: string,
  ssp: string,
  data: {[key: DMG]: CSVRow},
  scaler: (x: number) => number,
};
class DamageFigure extends React.Component<Props> {
  render() {
    const {rcp, data, ssp, scaler, height} = this.props;
    const damage_functions = [
      'bhm_sr',
      'bhm_richpoor_sr',
      'bhm_lr',
      'bhm_richpoor_lr',
      'djo',
    ];

    const dmg_height = height / damage_functions.length;

    return damage_functions.map((fn, idx) => {
      const row = data[fn] || {'16.7%': 0, '83.3%': 0, '50%': 0};

      const x1 = scaler(row['16.7%']);
      const x2 = scaler(row['83.3%']);

      const median = scaler(row['50%']);

      return (
        <React.Fragment key={fn}>
          <Motion
            defaultStyle={{x1: 0, x2: 0, median: 0}}
            style={{x1: spring(x1), x2: spring(x2), median: spring(median)}}
          >
            {value => (
              <React.Fragment>
                <line
                  className={fn}
                  x1={value.x1}
                  x2={value.x2}
                  y1={idx * dmg_height}
                  y2={idx * dmg_height}
                />

                {x1 - x2 !== 0 && (
                  <circle
                    cx={value.median || 0}
                    cy={idx * dmg_height}
                    r={1}
                    className={fn}
                  />
                )}
              </React.Fragment>
            )}
          </Motion>
        </React.Fragment>
      );
    });
  }
}

type F1Props = {
  country: string,
  onCountryChange: (country: string) => any,
  width: number,
  height: number,
};
type F1State = {};
export class Fig1Options extends React.Component<F1Props, F1State> {
  render() {
    const {country, width, height} = this.props;
    return (
      <div>
        <div className="fig1-picker-row">
          <CountryNamePicker country={country} onChange={({id}) => this.props.onCountryChange(id)}/>
          <button onClick={() => this.props.onCountryChange('WLD')}>
            reset to world
          </button>
        </div>
        <CSVLoader
          test={this.fixedDiscounting}
          csvPath={`${process.env.PUBLIC_URL || ''}/iso3_${country}.csv`}
        >
          {({data, loading}) => (
            <SCCFigure
              width={width}
              height={height}
              data={data}
              country={country}
            />
          )}
        </CSVLoader>
      </div>
    );
  }
  fixedDiscounting(row) {
    return row.prtp === '2';
  }
}
