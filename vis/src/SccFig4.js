// @flow

import * as React from "react";
import { scaleLinear, scaleDiverging, scaleLog } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";

import CSVLoader from "./csv-loader.js";

export class Fig4DataLoader extends React.PureComponent<*, *> {
  static defaultProps = {
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr",
    discounting: 'fixed',
    countriesToPlot: [
      "ARG",
      "AUS",
      "BRA",
      "CAN",
      "CHN",
      "DEU",
      "FRA",
      "GBR",
      "IDN",
      "IND",
      "ITA",
      "JPN",
      "KOR",
      "MEX",
      "RUS",
      "SAU",
      "TUR",
      "USA",
      "ZAF"
    ]
  };

  static growthAdjustedDiscounting(row: { prtp: string }) {
    return (
      row.prtp !== "2" &&
      row.dmgfuncpar === "bootstrap" &&
      row.climate === "uncertain"
    );
  }

  static fixedDiscounting(row: { prtp: string }) {
    return (
      row.prtp === "2" &&
      row.dmgfuncpar === "bootstrap" &&
      row.climate === "uncertain"
    );
  }

  basicFilter(row: *) {
    return (
      row.prtp === "2" &&
      row.dmgfuncpar === "bootstrap" &&
      row.climate === "uncertain"
    );
  }

  render() {
    const { width, height } = this.props;
    const { dmg, rcp, ssp } = this.props;
    const csvPath = `rcp_${rcp}_dmg_${dmg}_ssp_${ssp}.csv`;
    const test = this.props.discounting === 'fixed' ?
      Fig4DataLoader.fixedDiscounting :
      Fig4DataLoader.growthAdjustedDiscounting;

    return (
      <CSVLoader
        test={test}
        csvPath={`${process.env.PUBLIC_URL || ""}/${csvPath}`}
      >
        {({ data: csccData, loading: csccLoading }) => (
          <CSVLoader
            dynamicTyping={col => !col.includes("Country")}
            csvPath={`${process.env.PUBLIC_URL || ""}/gdp_pop_co2e.csv`}
          >
            {({ data: wbData, loading: pgLoading }) => {
              const worldData = csccData.find(r => r.ISO3 === "WLD");
              const totalCscc = worldData ? worldData["50%"] : 1;
              const allData = csccData
                .map(row => {
                  const worldBankData = wbData.find(
                    r => r["Country Code"] === row.ISO3
                  );
                  if (worldBankData) {
                    // Country Name,Country Code,2017 GDP,2017 Population,2014 Emissions,Emissions Share
                    return {
                      sccPerCapita: worldBankData["2017 Population"]
                        ? (1000000 * row["50%"]) /
                          worldBankData["2017 Population"]
                        : 0,
                      logGdp:
                        worldBankData["2017 GDP"] > 0
                          ? Math.log10(worldBankData["2017 GDP"])
                          : 0,
                      gdp: worldBankData["2017 GDP"],
                      shareEmissions: 100 * worldBankData["Emissions Share"],
                      shareScc: (100 * row["50%"]) / totalCscc,
                      ISO3: row.ISO3, // extras:
                      label: worldBankData["Country Name"]
                    };
                  } else {
                    console.warn(`no matching data for ${row.ISO3}`);
                    return row;
                  }
                })
                .filter(row => this.props.countriesToPlot.includes(row.ISO3));

              return this.props.children
                ? this.props.children({
                    data: allData
                  })
                : null;
            }}
          </CSVLoader>
        )}
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
    domainY: [-4, 23],
    xAxis: [0, 10, 20, 30],
    yAxis: [0, 5, 10, 15, 20],
    labelCountries: ["USA"]
  };

  render() {
    const { data, width, height, domainX, domainY } = this.props;
    // both input domain and ranges are specified as in paper
    const scaleX = scaleLinear()
      .domain(domainX)
      .range([0, width]);
    const scaleY = scaleLinear() // invert axes
      .domain(domainY)
      .range([height, 0]);

    const gdps = data.map(r => r.gdp);
    const gdpDomain =
      gdps.length > 0 ? [Math.min(...gdps), Math.max(...gdps)] : [5.3, 14];

    const scaleR = scaleLog()
      .domain(gdpDomain)
      .range([1, 30]);

    const color = scaleDiverging(interpolateRdBu)
      .domain([-0.15, 0, 0.23])
      .clamp(true);

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Fig4Axes
          domainX={domainX}
          domainY={domainY}
          scaleX={scaleX.clamp(true)}
          scaleY={scaleY.clamp(true)}
          xAxis={this.props.xAxis}
          yAxis={this.props.yAxis}
        />
        {data
          .filter(row => {
            return (
              row.shareEmissions <= domainX[1] && row.shareScc <= domainY[1]
            );
          })
          .map(row => {
            return (
              <React.Fragment key={row.ISO3}>
                <circle
                  key={row.ISO3}
                  cx={scaleX(row.shareEmissions)}
                  cy={scaleY(row.shareScc)}
                  fill={color(-0.75 * row.sccPerCapita)}
                  r={scaleR(row.gdp) / 2}
                  strokeWidth={1}
                  stroke="#444"
                />
                {this.props.labelCountries.includes(row.ISO3) && (
                  <text
                    style={{ fontSize: 12 }}
                    x={scaleX(row.shareEmissions)}
                    y={scaleY(row.shareScc) + scaleR(row.gdp) * 0.75}
                  >
                    {row.label}
                  </text>
                )}
              </React.Fragment>
            );
          })}
      </svg>
    );
  }
}

const Fig4Axes = ({ xAxis, yAxis, domainX, domainY, scaleX, scaleY }) => {
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
        <line
          key={`xAxisAt${x}`}
          x1={scaleX(x)}
          x2={scaleX(x)}
          y1={scaleY(40)}
          y2={scaleY(-20)}
          stroke="#ddd"
          strokeWidth={1}
        />
      ))}
      {yAxis.map(y => (
        <line
          key={`xAxisAt${y}`}
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
          key={`${x}:${y}`}
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
