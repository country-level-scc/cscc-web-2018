// @flow

import * as React from "react";
import { scaleLinear, scaleDiverging, scaleLog } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import { Motion, spring } from "react-motion";

import CSVLoader from "./csv-loader.js";

export class Fig4DataLoader extends React.PureComponent<*, *> {
  static defaultProps = {
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr",
    discounting: "fixed",
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

  getEuData(csccData, wbData) {
    const euCountries = [
      "AUT",
      "BEL",
      "BGR",
      "HRV",
      "CYP",
      "CZE",
      "DNK",
      "EST",
      "FIN",
      "FRA",
      "DEU",
      "GRC",
      "HUN",
      "IRL",
      "ITA",
      "LVA",
      "LTU",
      "LUX",
      "MLT",
      "NLD",
      "POL",
      "PRT",
      "ROU",
      "SVK",
      "SVN",
      "ESP",
      "SWE",
      "GBR"
    ];
    const worldCsccData = csccData.find(r => r.ISO3 === "WLD");
    const worldData = wbData.find(r => r["Country Code"] === "WLD");

    if (!worldCsccData) {
      return;
    }

    const wbEu = wbData.filter(r => euCountries.includes(r["Country Code"]));
    const csccEu = csccData.filter(r => euCountries.includes(r.ISO3));

    const euCo2eShare = wbEu.reduce(
      (acc, curr) => acc + curr["Emissions Share"],
      0
    );
    const euPop = wbEu.reduce((acc, curr) => acc + curr["2017 Population"], 0);
    const euGdp = wbEu.reduce((acc, curr) => acc + curr["2017 GDP"], 0);
    const euScc = csccEu.reduce((acc, curr) => acc + curr["50%"], 0);
    const euSccPerCapita = (1000000 * euScc) / euPop;
    const euLogGdp = Math.log10(euGdp);
    return {
      sccPerCapita: euSccPerCapita,
      logGdp: euLogGdp,
      gdp: euGdp,
      shareEmissions: 100 * euCo2eShare,
      shareScc: (100 * euScc) / worldCsccData["50%"],
      ISO3: "EUC",
      label: "The EU",
      population: euPop
    };
  }

  render() {
    const { width, height } = this.props;
    const { dmg, rcp, ssp } = this.props;
    const csvPath = `rcp_${rcp}_dmg_${dmg}_ssp_${ssp}.csv`;
    const test =
      this.props.discounting === "fixed"
        ? Fig4DataLoader.fixedDiscounting
        : Fig4DataLoader.growthAdjustedDiscounting;

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
              const worldCsccData = csccData.find(r => r.ISO3 === "WLD");
              const worldData = wbData.find(r => r["Country Code"] === "WLD");

              const euData = this.getEuData(csccData, wbData);

              const totalCscc = worldCsccData ? worldCsccData["50%"] : 1;
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
                    data: euData ? [...allData, euData] : allData
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
    domainY: [-6, 23],
    xAxis: [0, 10, 20, 30],
    yAxis: [-5, 0, 5, 10, 15, 20],
    labelCountries: ["USA", "CHN", "IND", "EUC"],
    clip: false,
  };

  render() {
    const {
      data,
      width,
      height,
      domainX,
      domainY: initialDomainY
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
      .range([0, width]);

    const shareSccs = data.map(r => r.shareScc);
    // y axis is shareScc
    // width is logGdp
    // const maxGdp = gdps.length > 0 ? Math.log10(Math.max(...gdps)) : 0;
    const maxGdp= 4
    const domainY =
      width > 399
        ? [Math.min(...shareSccs) - maxGdp, Math.max(...shareSccs) + maxGdp]
        : initialDomainY;
    const scaleY = scaleLinear() // invert axes
      .domain(domainY)
      .range([height, 0]);

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
            // could use this to clip data if clip prop specified
            return this.props.clip ? row.shareEmissions <= domainX[1] && row.shareScc <= domainY[1] : true;
          })
          .map(row => {
            return (
              <Motion
                key={row.ISO3}
                defaultStyle={{
                  x: scaleX(0),
                  y: scaleY(0),
                  r: 0,
                  capita: 0,
                  textY: scaleY(0)
                }}
                style={{
                  x: spring(scaleX(row.shareEmissions)),
                  y: spring(scaleY(row.shareScc)),
                  capita: spring(-0.75 * row.sccPerCapita),
                  r: spring(scaleR(row.gdp) / 2),
                  textY: spring(scaleY(row.shareScc) + scaleR(row.gdp) * 0.95)
                }}
              >
                {values => (
                  <React.Fragment key={row.ISO3}>
                    <circle
                      title={`${row.label}: ${color(values.capita)}`}
                      key={row.ISO3}
                      cx={values.x}
                      cy={values.y}
                      fill={
                        color(values.capita) /*color(-0.75 * row.sccPerCapita)*/
                      }
                      r={values.r}
                      strokeWidth={1}
                      stroke="#444"
                    />
                    {this.props.labelCountries.includes(row.ISO3) && (
                      <text
                        style={{ fontSize: 12 }}
                        x={scaleX(row.shareEmissions)}
                        y={values.y + scaleR(row.gdp) * 0.75}
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
