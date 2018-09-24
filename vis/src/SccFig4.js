// @flow

import * as React from 'react';
import {scaleLinear, scaleDiverging, scaleLog} from 'd3-scale';
import {interpolateRdBu, schemeRdBu} from 'd3-scale-chromatic';
import {Motion, spring} from 'react-motion';
import uniqueId from 'lodash/uniqueId';
import range from 'lodash/range';

import CSVLoader from './csv-loader.js';

export class Fig4DataLoader extends React.PureComponent<*, *> {
  static defaultProps = {
    ssp: 'SSP2',
    rcp: 'rcp60',
    dmg: 'bhm_sr',
    discounting: 'growth adjusted',
    countriesToPlot: [
      'ARG',
      'AUS',
      'BRA',
      'CAN',
      'CHN',
      'DEU',
      'FRA',
      'GBR',
      'IDN',
      'IND',
      'ITA',
      'JPN',
      'KOR',
      'MEX',
      'RUS',
      'SAU',
      'TUR',
      'USA',
      'ZAF',
    ],
  };

  static fixedDiscounting(row: {prtp: string}) {
    return (
      row.prtp !== '2' &&
      row.dmgfuncpar === 'bootstrap' &&
      row.climate === 'uncertain'
    );
  }

  static growthAdjustedDiscounting(row: {prtp: string}) {
    return (
      row.prtp === '2' &&
      row.dmgfuncpar === 'bootstrap' &&
      row.climate === 'uncertain'
    );
  }

  basicFilter(row: *) {
    return (
      row.prtp === '2' &&
      row.dmgfuncpar === 'bootstrap' &&
      row.climate === 'uncertain'
    );
  }

  getEuData(csccData, wbData) {
    const euCountries = [
      'AUT',
      'BEL',
      'BGR',
      'HRV',
      'CYP',
      'CZE',
      'DNK',
      'EST',
      'FIN',
      'FRA',
      'DEU',
      'GRC',
      'HUN',
      'IRL',
      'ITA',
      'LVA',
      'LTU',
      'LUX',
      'MLT',
      'NLD',
      'POL',
      'PRT',
      'ROU',
      'SVK',
      'SVN',
      'ESP',
      'SWE',
      'GBR',
    ];
    const worldCsccData = csccData.find(r => r.ISO3 === 'WLD');
    // const worldData = wbData.find(r => r['Country Code'] === 'WLD');

    if (!worldCsccData) {
      return;
    }

    const wbEu = wbData.filter(r => euCountries.includes(r['Country Code']));
    const csccEu = csccData.filter(r => euCountries.includes(r.ISO3));

    const euCo2eShare = wbEu.reduce(
      (acc, curr) => acc + curr['Emissions Share'],
      0,
    );
    const euPop = wbEu.reduce((acc, curr) => acc + curr['2017 Population'], 0);
    const euGdp = wbEu.reduce((acc, curr) => acc + curr['2017 GDP'], 0);
    const euScc = csccEu.reduce((acc, curr) => acc + curr['50%'], 0);
    const euSccPerCapita = 1000000 * euScc / euPop;
    const euLogGdp = Math.log10(euGdp);
    return {
      sccPerCapita: euSccPerCapita,
      logGdp: euLogGdp,
      gdp: euGdp,
      shareEmissions: 100 * euCo2eShare,
      shareScc: 100 * euScc / worldCsccData['50%'],
      ISO3: 'EUC',
      label: 'EU',
      population: euPop,
      scc: euScc,
    };
  }

  getAllData(csccData, wbData) {
    const worldCsccData = csccData.find(r => r.ISO3 === 'WLD');
    const totalCscc = worldCsccData ? worldCsccData['50%'] : 1;

    return csccData
      .map(row => {
        const worldBankData = wbData.find(r => r['Country Code'] === row.ISO3);
        if (worldBankData) {
          // Country Name,Country Code,2017 GDP,2017 Population,2014 Emissions,Emissions Share
          return {
            sccPerCapita: worldBankData['2017 Population']
              ? 1000000 * row['50%'] / worldBankData['2017 Population']
              : 0,
            logGdp:
              worldBankData['2017 GDP'] > 0
                ? Math.log10(worldBankData['2017 GDP'])
                : 0,
            gdp: worldBankData['2017 GDP'],
            shareEmissions: 100 * worldBankData['Emissions Share'],
            shareScc: 100 * row['50%'] / totalCscc,
            ISO3: row.ISO3, // extras:
            label: worldBankData['Country Name'],
            scc: row['50%'],
          };
        } else {
          debugger;
          return {
            sccPerCapita: 0,
            logGdp: 0,
            gdp: 0,
            shareEmissions: 0,
            shareScc: 0,
            ISO3: row.ISO3, // extras:
            label: '',
            scc: 0,
          };
        }
      })
      .filter(row => this.props.countriesToPlot.includes(row.ISO3));
  }

  dataToRender(csccData, wbData) {
    const euData = this.getEuData(csccData, wbData);
    const allData = this.getAllData(csccData, wbData);
    return euData ? [...allData, euData] : allData;
  }

  state = {
    csccData: [],
    csccLoading: true,
    wbData: [],
    wbLoading: true,
  };

  getData = () => {
    return this.dataToRender(this.state.csccData, this.state.wbData);
  };

  render() {
    const {dmg, rcp, ssp} = this.props;
    const csvPath = `rcp_${rcp}_dmg_${dmg}_ssp_${ssp}.csv`;
    const test =
      this.props.discounting === 'fixed'
        ? Fig4DataLoader.fixedDiscounting
        : Fig4DataLoader.growthAdjustedDiscounting;

    const data = this.getData();

    return (
      <React.Fragment>
        <CSVLoader
          test={test}
          csvPath={`${process.env.PUBLIC_URL || ''}/${csvPath}`}
          onChange={({data, loading}) =>
            this.setState({csccData: data, csccLoading: loading})
          }
        />
        <CSVLoader
          dynamicTyping={col => !col.includes('Country')}
          csvPath={`${process.env.PUBLIC_URL || ''}/gdp_pop_co2e.csv`}
          onChange={({data, loading}) =>
            this.setState({wbData: data, wbLoading: loading})
          }
        />
        {this.props.children({data})}
      </React.Fragment>
    );
  }
}

export class CsccFig4 extends React.Component<*, *> {
  static defaultProps = {
    width: 400,
    height: 300,
    data: [],
    domainX: [-1, 32],
    domainY: [-6, 23],
    xAxis: [0, 10, 20, 30],
    yAxis: [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35],
    labelCountries: [
      'USA',
      'CHN',
      'IND',
      'EUC',
      'RUS',
      'MEX',
      'SAU',
      'BRA',
      'CAN',
      'JPN',
    ],
    clip: false,
    padding: {x: 20, y: 10},
  };

  render() {
    const {
      data,
      width,
      height,
      domainX,
      domainY: initialDomainY,
      padding,
    } = this.props;
    const gdps = data.map(r => r.gdp);
    const gdpDomain =
      gdps.length > 0 ? [Math.min(...gdps), Math.max(...gdps)] : [5.3, 14];

    const scaleR = scaleLog()
      .domain(gdpDomain)
      .range([1, 30]);

    // both input domain and ranges are specified as in paper
    const scaleX = scaleLinear()
      .domain(domainX)
      .range([padding.x, width - 1]);

    const shareSccs = data.length > 0 ? data.map(r => r.shareScc) : [-5, 25];
    // y axis is shareScc
    // width is logGdp
    // const maxGdp = gdps.length > 0 ? Math.log10(Math.max(...gdps)) : 0;
    const maxGdp = 4;
    const domainY =
      width > 399
        ? [Math.min(...shareSccs) - maxGdp, Math.max(...shareSccs) + maxGdp]
        : initialDomainY;
    const scaleY = scaleLinear() // invert axes
      .domain(domainY)
      .range([height - padding.y, 1]);

    const color = scaleDiverging(interpolateRdBu)
      // .domain([-0.15, 0, 0.23])
      .domain([-0.5, 0, 0.25])
      .clamp(true);

    const safe = val => {
      if (Number.isNaN(val) || val == null) {
        return 0;
      } else {
        return val;
      }
    };

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <Fig4Axes
          domainX={domainX}
          domainY={domainY}
          scaleX={scaleX.clamp(true)}
          scaleY={scaleY.clamp(true)}
          xAxis={this.props.xAxis}
          yAxis={this.props.yAxis}
          padding={padding}
        />
        {data
          .filter(row => {
            // could use this to clip data if clip prop specified
            return this.props.clip
              ? row.shareEmissions <= domainX[1] && row.shareScc <= domainY[1]
              : true;
          })
          .map(row => {
            const shareEmissions = safe(row.shareEmissions);
            const shareScc = safe(row.shareScc);
            const gdp = safe(row.gdp);
            const gdpRadius = safe(scaleR(gdp));
            const sccPerCapita = safe(row.sccPerCapita);
            return (
              <Motion
                key={`${row.ISO3}`}
                defaultStyle={{
                  x: scaleX(shareEmissions),
                  y: scaleY(shareScc),
                  r: gdpRadius / 2,
                  capita: sccPerCapita,
                  textY: scaleY(shareScc) + gdpRadius * 2.1,
                }}
                style={{
                  x: spring(scaleX(shareEmissions)),
                  y: spring(scaleY(shareScc)),
                  capita: spring(sccPerCapita),
                  r: spring(gdpRadius / 2),
                  textY: spring(scaleY(shareScc) + gdpRadius * 2.1),
                }}
              >
                {values => (
                  <React.Fragment key={row.ISO3}>
                    <circle
                      title={`${row.label}: ${values.capita}== ${color(
                        values.capita,
                      )}`}
                      key={row.ISO3}
                      cx={safe(values.x)}
                      cy={safe(values.y)}
                      fill={color(safe(-1 * values.capita))}
                      className="fig4-circle"
                      r={safe(values.r)}
                      strokeWidth={1}
                      stroke="#444"
                      onClick={() => {
                        this.props.onCountrySelect &&
                          this.props.onCountrySelect({
                            ...row,
                            color: color(safe(-1 * sccPerCapita)),
                            radius: safe(gdpRadius / 2),
                          });
                      }}
                    />
                    {this.props.labelCountries.includes(row.ISO3) && (
                      <text
                        style={{fontSize: 12, pointerEvents: 'none'}}
                        x={scaleX(safe(row.shareEmissions))}
                        y={safe(values.y) + safe(scaleR(safe(row.gdp))) * 0.85}
                      >
                        {row.label}
                      </text>
                    )}
                  </React.Fragment>
                )}
              </Motion>
            );
          })}
      </svg>
    );
  }
}

const Fig4Axes = ({
  xAxis,
  yAxis,
  domainX,
  domainY,
  scaleX,
  scaleY,
  padding,
}) => {
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
      {xAxis.map(x => (
        <React.Fragment key={`xAxisAt${x}`}>
          <line
            x1={scaleX(x)}
            x2={scaleX(x)}
            y1={scaleY(45)}
            y2={scaleY(-40) + 2}
            stroke="#ddd"
            strokeWidth={1}
          />
          <text
            x={scaleX(x)}
            y={scaleY(-40) + 10}
            fontSize={10}
            color="#666"
            textAnchor="middle"
          >
            {x}
          </text>
        </React.Fragment>
      ))}
      {yAxis.filter(y => y >= domainY[0] && y <= domainY[1]).map(y => (
        <Motion
          key={`xAxisAt${y}`}
          defaultStyle={{y: scaleY(y) || 0}}
          style={{y: spring(scaleY(y))}}
        >
          {values => (
            <React.Fragment>
              <line
                x1={scaleX(-20) - 4}
                x2={scaleX(40)}
                y1={values.y}
                y2={values.y}
                stroke="#ddd"
                strokeWidth={1}
              />
              <text
                x={scaleX(0) - 16}
                y={values.y + 2}
                fontSize={10}
                color="#666"
                textAnchor="end"
              >
                {y}
              </text>
            </React.Fragment>
          )}
        </Motion>
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
          [2, -1],
        ]}
      />
    </g>
  );
};

const SlopeLines = ({scaleX, scaleY, domainX, domainY, slopes}) => (
  <React.Fragment>
    {slopes.map(([y, x]) => {
      const m = y / x;
      const yInt = x > 0 ? (x === 1 ? domainY[1] : m * domainX[1]) : domainY[0];
      const xInt = x === 2 || x === 4 ? domainX[1] : yInt / m;
      return (
        <line
          key={`${x}:${y}`}
          id={`${x}:${y}`}
          x1={scaleX(0)}
          y1={scaleY(0)}
          x2={scaleX(xInt)}
          y2={scaleY(yInt)}
          strokeWidth={1}
          stroke={x === y ? '#aaa' : '#eee'}
        />
      );
    })}
  </React.Fragment>
);

export class Fig4Legend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gradientId: uniqueId('gradient'),
    };
  }
  render() {
    const colorInterpolate = scaleDiverging(interpolateRdBu)
      .domain([-0.5, 0, 0.25])
      .clamp(true);

    const width = 0.75 / 10;

    const scaleY = scaleLinear()
      .domain([-0.25, 0.5])
      .range([80, 0])
      .clamp(true);

    const scaleR = scaleLog()
      .domain([5.3, 14])
      .range([1, 30]);

    return (
      <svg>
        <defs>
          <linearGradient
            id={this.state.gradientId}
            gradientTransform="rotate(90)"
          >
            {range(11).map(idx => (
              <stop
                key={idx}
                offset={`${idx * 10}%`}
                stopColor={colorInterpolate(idx * width - 0.5)}
              />
            ))}
          </linearGradient>
        </defs>
        <text x={90} y={20} fontSize={10}>
          SCC Per Capita (US$/MtCO2/person)
        </text>
        <g transform="translate(25 10)">
          <rect
            width={30}
            height={80}
            fill={`url(#${this.state.gradientId})`}
            x={0}
            y={0}
          />
          <text y={scaleY(0) + 3} x={35} fontSize={10}>
            0
          </text>
          <line
            x1={0}
            x2={5}
            y1={scaleY(0)}
            y2={scaleY(0)}
            strokeWidth={1}
            stroke="#666"
          />
          <line
            x1={25}
            x2={30}
            y1={scaleY(0)}
            y2={scaleY(0)}
            strokeWidth={1}
            stroke="#666"
          />
          <line
            x1={0}
            x2={5}
            y1={scaleY(0.5 - width / 2)}
            y2={scaleY(0.5 - width / 2)}
            strokeWidth={1}
            stroke="#fff"
          />
          <line
            x1={25}
            x2={30}
            y1={scaleY(0.5 - width / 2)}
            y2={scaleY(0.5 - width / 2)}
            strokeWidth={1}
            stroke="#fff"
          />

          <line
            x1={0}
            x2={5}
            y1={scaleY(-0.25 + width / 2)}
            y2={scaleY(-0.25 + width / 2)}
            strokeWidth={1}
            stroke="#fff"
          />
          <line
            x1={25}
            x2={30}
            y1={scaleY(-0.25 + width / 2)}
            y2={scaleY(-0.25 + width / 2)}
            strokeWidth={1}
            stroke="#fff"
          />
          <text y={scaleY(0.5 - width / 2) + 3} x={35} fontSize={10}>
            0.5
          </text>
          <text y={scaleY(-0.25 + width / 2) + 3} x={35} fontSize={10}>
            -0.25
          </text>
        </g>
        <g transform="translate(90 100)">
          <text x={0} y={10} fontSize={10}>
            Log(GDP(US$))
          </text>
          <circle
            r={scaleR(7)}
            cx={10}
            cy={30}
            strokeWidth={1}
            stroke="#666"
            fill="transparent"
          />
          <text fontSize={10} x={10} y={33} textAnchor="middle">
            7
          </text>
          <circle
            r={scaleR(8)}
            cx={40}
            cy={30}
            strokeWidth={1}
            stroke="#666"
            fill="transparent"
          />
          <text fontSize={10} x={40} y={33} textAnchor="middle">
            8
          </text>
          <circle
            r={scaleR(9)}
            cx={80}
            cy={30}
            strokeWidth={1}
            stroke="#666"
            fill="transparent"
          />
          <text fontSize={10} x={80} y={33} textAnchor="middle">
            9
          </text>
        </g>
      </svg>
    );
  }
}
