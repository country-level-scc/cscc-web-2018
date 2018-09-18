// @flow
import * as React from "react";
import { scaleLinear } from "d3-scale";
import _range from "lodash/range";
import { Motion, spring } from "react-motion";
import Papa from "papaparse";
import CSVLoader from "./csv-loader";

import { SSPS, RCPS } from "./constants";

type SSP = "SSP1" | "SSP2" | "SSP3" | "SSP4" | "SSP5";
type RCP = "rcp45" | "rcp60" | "rcp85";
type DMG = "bhm_sr" | "bhm_richpoor_sr" | "bhm_lr" | "bhm_richpoor_lr" | "djo";
type CSVRow = {|
  run: DMG,
  dmgfuncpar: string,
  climate: "expected" | "uncertain",
  SSP: SSP,
  RCP: RCP,
  N: *,
  ISO3: string,
  prtp: "1p5",
  eta: "2",
  dr: "NA" | "3",
  "16.7%": number,
  "50%": number,
  "83.3%": number
|};

const dataForParams = (data: Array<CSVRow>, ssp: SSP, rcp: RCP) =>
  data
    .filter(row => row.SSP === ssp)
    .filter(row => row.RCP === rcp)
    .reduce(
      (prev, curr) => ({
        ...prev,
        [curr.run]: curr
      }),
      {}
    );

const Scales = ({ minX, maxX, scaler, height, slices = 5 }) => {
  const sliceWidth = Math.floor((maxX - minX) / slices);
  const ticks = _range(Math.floor(minX), Math.ceil(maxX), sliceWidth);
  return (
    <g>
      <line x1={1} x2={1} y1={0} y2={height} stroke="#aaa" />
      <line y1={height} y2={height} stroke="#aaa" x1={1} x2={scaler(maxX)} />
      {ticks.map((t, idx) => (
        <Motion
          key={idx}
          defaultStyle={{ x: 0 }}
          style={{ x: spring(scaler(t)) }}
        >
          {values => (
            <React.Fragment>
              <line
                x1={values.x}
                x2={values.x}
                y1={height-3}
                y2={height}
                stroke="#aaa"
              />
              <text
                className="tickLabel"
                x={values.x}
                y={height+10}
                textAnchor="middle"
              >
                {Number(t).toLocaleString()}
              </text>
            </React.Fragment>
          )}
        </Motion>
      ))}
    </g>
  );
};

const minMax = (data: Array<CSVRow>): { max: number, min: number } => {
  let min = 0,
    max = 0;
  data.forEach(row => {
    const d = [row["16.7%"], row["83.3%"]];
    min = min ? Math.min(min, ...d) : Math.min(...d);
    max = max ? Math.max(max, ...d) : Math.max(...d);
  });
  return { min, max };
};

const inferredClamp = (data: Array<CSVRow>) => {
  const slice = data
    .filter(row => row.RCP === "rcp60")
    .filter(row => row.SSP === "SSP2")
    .filter(row => row.run === "bhm_sr");
  if (slice.length === 1) {
    return (slice[0]["83.3%"] - slice[0]["16.7%"]) * 20;
  } else {
    // return 10k as default if this fails (which should error out)
    // console.log(`unable to find a max bounds for ${data[0] && data[0].ISO3}`);
    return 10000;
  }
};

type Fig1Props = {
  country: string,
  data: *,
  clamp?: number
};

class SCCFigure extends React.Component<Fig1Props> {
  static defaultProps={
    width: 400,
    height: 300,
  }
  render() {
    const { country, data, clamp, width, height, paddingY=35 } = this.props;
    const { min, max } = minMax(data);
    const inferred = inferredClamp(data);
    const maxActual = clamp !== undefined ? clamp : Math.min(inferred, max);

    const paddingLeft = 200
    const scaler = scaleLinear()
      .clamp(true) // clamp b/c values may be negative
      .domain([min, maxActual])
      .range([10, width - paddingLeft-5]);

    const rowHeight = (height - (SSPS.length - 1) * paddingY) / SSPS.length;
    const rowOffest = rowHeight + paddingY;

    return (
      <svg viewBox={`-${paddingLeft} -5 ${width+100} ${height+30}`} width={width} height={height}>
        {SSPS.map(({ value: ssp }, i) => {
          const startY = i * rowOffest;
          return (
            <g key={ssp} transform={`translate(0,${startY})`}>
              <DamageGroup ssp={ssp} data={data} scaler={scaler} height={rowHeight} />
              <text
                className="fig1-major-y-label"
                y={rowHeight / 2 - 9}
                x={-50}
                textAnchor="end"
                style={{ fontSize: 14, width: 40 }}
              >
                {sspLabels[ssp]}
              </text>
            </g>
          );
        })}
        <Scales minX={min} maxX={maxActual} height={height} scaler={scaler} />

        <text className="fig1-attr" x={width-paddingLeft} y={height+40} textAnchor="end">
          Ricke et al. Country-level social cost of carbon. (2018).
        </text>
      </svg>
    );
  }
}

const sspLabels = {
  SSP1: 'Sustainability',
  SSP2: <React.Fragment>
    <tspan textAnchor='end' x={-50} y='1em'>Middle</tspan>
    <tspan textAnchor='end' x={-50} dy='1.3em'>of the</tspan>
    <tspan textAnchor='end' x={-50} dy='1.3em'>Road</tspan>
  </React.Fragment>,
  SSP3: <React.Fragment>
    <tspan textAnchor='end' x={-50}>Regional</tspan>
    <tspan textAnchor='end' x={-50} dy='1.3em'>Rivalry</tspan>
  </React.Fragment>,
  SSP4: 'Inequality',
  SSP5: <React.Fragment>
    <tspan textAnchor='end' x={-50}>Fossil-fueled</tspan>
    <tspan textAnchor='end' x={-50} dy='1.3em'>Development</tspan>
  </React.Fragment>,
}

export default SCCFigure;

const DamageGroup = ({ ssp, data, scaler, height }) => {
  const rcpRowHeight = height / RCPS.length;
  return RCPS.map(({ value: rcp, label }, j) => (
    <g
      key={rcp}
      transform={`translate(0,${j * rcpRowHeight})`}
      // onMouseEnter={() => console.log({ rcp, ssp })}
      className={[rcp, ssp, "scc"].join(" ")}
    >
      <DamageFigure
        rcp={rcp}
        ssp={ssp}
        data={dataForParams(data, ssp, rcp)}
        scaler={scaler}
        height={rcpRowHeight}
      />
      <text
        x={-2}
        y={4}
        textAnchor="end"
        strokeWidth={0}
        className="rcpLabel"
      >
        {label}
      </text>
      <line x1={1} y1={2} x2={4} y2={2} strokeWidth={1} stroke="#aaa" />
    </g>
  ));
};

type Props = {
  rcp: string,
  ssp: string,
  data: { [key: DMG]: CSVRow },
  scaler: (x: number) => number
};
class DamageFigure extends React.Component<Props> {
  render() {
    const { rcp, data, ssp, scaler, height } = this.props;
    const damage_functions = [
      "bhm_sr",
      "bhm_richpoor_sr",
      "bhm_lr",
      "bhm_richpoor_lr",
      "djo"
    ];

    const dmg_height = height / damage_functions.length;

    return damage_functions.map((fn, idx) => {
      const row = data[fn] || { "16.7%": 0, "83.3%": 0, "50%": 0 };

      const x1 = scaler(row["16.7%"]);
      const x2 = scaler(row["83.3%"]);

      const median = scaler(row["50%"]);

      return (
        <React.Fragment key={fn}>
          <Motion
            defaultStyle={{ x1: 0, x2: 0, median: 0 }}
            style={{ x1: spring(x1), x2: spring(x2), median: spring(median) }}
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
  height: number
};
type F1State = {};
export class Fig1Options extends React.Component<F1Props, F1State> {
  render() {
    const { country, width, height } = this.props;
    return (
      <div>
        <div>
        <select
          name="country"
          value={this.props.country}
          onChange={evt => this.props.onCountryChange(evt.target.value)}
        >
          {countries.map(({ id, label }, idx) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => this.props.onCountryChange("WLD")}>
          reset to world
        </button>
        </div>
        <CSVLoader
          test={this.fixedDiscounting}
          csvPath={`${process.env.PUBLIC_URL || ""}/iso3_${country}.csv`}
        >
          {({ data, loading }) => (
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
    return row.prtp === "2";
  }
}

const countries = [
  { id: "WLD", label: "World" },
  { id: "AFG", label: "Afghanistan" },
  { id: "ALB", label: "Albania" },
  { id: "DZA", label: "Algeria" },
  { id: "AGO", label: "Angola" },
  { id: "ARG", label: "Argentina" },
  { id: "ARM", label: "Armenia" },
  { id: "AUS", label: "Australia" },
  { id: "AUT", label: "Austria" },
  { id: "AZE", label: "Azerbaijan" },
  { id: "BHS", label: "Bahamas" },
  { id: "BGD", label: "Bangladesh" },
  { id: "BLR", label: "Belarus" },
  { id: "BEL", label: "Belgium" },
  { id: "BLZ", label: "Belize" },
  { id: "BEN", label: "Benin" },
  { id: "BTN", label: "Bhutan" },
  { id: "BOL", label: "Bolivia" },
  { id: "BIH", label: "Bosnia and Herz." },
  { id: "BWA", label: "Botswana" },
  { id: "BRA", label: "Brazil" },
  { id: "BRN", label: "Brunei" },
  { id: "BGR", label: "Bulgaria" },
  { id: "BFA", label: "Burkina Faso" },
  { id: "BDI", label: "Burundi" },
  { id: "KHM", label: "Cambodia" },
  { id: "CMR", label: "Cameroon" },
  { id: "CAN", label: "Canada" },
  { id: "CAF", label: "Central African Rep." },
  { id: "TCD", label: "Chad" },
  { id: "CHL", label: "Chile" },
  { id: "CHN", label: "China" },
  { id: "COL", label: "Colombia" },
  { id: "COG", label: "Congo" },
  { id: "CRI", label: "Costa Rica" },
  { id: "CIV", label: "Cóte d'Ivoire" },
  { id: "HRV", label: "Croatia" },
  { id: "CUB", label: "Cuba" },
  { id: "CZE", label: "Czechia" },
  { id: "COD", label: "Dem. Rep. Congo" },
  { id: "DNK", label: "Denmark" },
  { id: "DJI", label: "Djibouti" },
  { id: "DOM", label: "Dominican Rep." },
  { id: "ECU", label: "Ecuador" },
  { id: "EGY", label: "Egypt" },
  { id: "SLV", label: "El Salvador" },
  { id: "GNQ", label: "Eq. Guinea" },
  { id: "ERI", label: "Eritrea" },
  { id: "EST", label: "Estonia" },
  { id: "SWZ", label: "eSwatini" },
  { id: "ETH", label: "Ethiopia" },
  { id: "FJI", label: "Fiji" },
  { id: "FIN", label: "Finland" },
  { id: "FRA", label: "France" },
  { id: "GAB", label: "Gabon" },
  { id: "GMB", label: "Gambia" },
  { id: "GEO", label: "Georgia" },
  { id: "DEU", label: "Germany" },
  { id: "GHA", label: "Ghana" },
  { id: "GRC", label: "Greece" },
  { id: "GTM", label: "Guatemala" },
  { id: "GIN", label: "Guinea" },
  { id: "GNB", label: "Guinea-Bissau" },
  { id: "GUY", label: "Guyana" },
  { id: "HTI", label: "Haiti" },
  { id: "HND", label: "Honduras" },
  { id: "HUN", label: "Hungary" },
  { id: "ISL", label: "Iceland" },
  { id: "IND", label: "India" },
  { id: "IDN", label: "Indonesia" },
  { id: "IRN", label: "Iran" },
  { id: "IRQ", label: "Iraq" },
  { id: "IRL", label: "Ireland" },
  { id: "ISR", label: "Israel" },
  { id: "ITA", label: "Italy" },
  { id: "JAM", label: "Jamaica" },
  { id: "JPN", label: "Japan" },
  { id: "JOR", label: "Jordan" },
  { id: "KAZ", label: "Kazakhstan" },
  { id: "KEN", label: "Kenya" },
  { id: "KWT", label: "Kuwait" },
  { id: "KGZ", label: "Kyrgyzstan" },
  { id: "LAO", label: "Laos" },
  { id: "LVA", label: "Latvia" },
  { id: "LBN", label: "Lebanon" },
  { id: "LSO", label: "Lesotho" },
  { id: "LBR", label: "Liberia" },
  { id: "LBY", label: "Libya" },
  { id: "LTU", label: "Lithuania" },
  { id: "LUX", label: "Luxembourg" },
  { id: "MKD", label: "Macedonia" },
  { id: "MDG", label: "Madagascar" },
  { id: "MWI", label: "Malawi" },
  { id: "MYS", label: "Malaysia" },
  { id: "MLI", label: "Mali" },
  { id: "MRT", label: "Mauritania" },
  { id: "MEX", label: "Mexico" },
  { id: "MDA", label: "Moldova" },
  { id: "MNG", label: "Mongolia" },
  { id: "MNE", label: "Montenegro" },
  { id: "MAR", label: "Morocco" },
  { id: "MOZ", label: "Mozambique" },
  { id: "MMR", label: "Myanmar" },
  { id: "CYP", label: "N. Cyprus" },
  { id: "NAM", label: "Namibia" },
  { id: "NPL", label: "Nepal" },
  { id: "NLD", label: "Netherlands" },
  { id: "NCL", label: "New Caledonia" },
  { id: "NZL", label: "New Zealand" },
  { id: "NIC", label: "Nicaragua" },
  { id: "NER", label: "Niger" },
  { id: "NGA", label: "Nigeria" },
  { id: "NOR", label: "Norway" },
  { id: "OMN", label: "Oman" },
  { id: "PAK", label: "Pakistan" },
  { id: "PAN", label: "Panama" },
  { id: "PNG", label: "Papua New Guinea" },
  { id: "PRY", label: "Paraguay" },
  { id: "PER", label: "Peru" },
  { id: "PHL", label: "Philippines" },
  { id: "POL", label: "Poland" },
  { id: "PRT", label: "Portugal" },
  { id: "QAT", label: "Qatar" },
  { id: "ROU", label: "Romania" },
  { id: "RUS", label: "Russia" },
  { id: "RWA", label: "Rwanda" },
  { id: "SAU", label: "Saudi Arabia" },
  { id: "SEN", label: "Senegal" },
  { id: "SRB", label: "Serbia" },
  { id: "SLE", label: "Sierra Leone" },
  { id: "SVK", label: "Slovakia" },
  { id: "SVN", label: "Slovenia" },
  { id: "SLB", label: "Solomon Is." },
  { id: "SOM", label: "Somalia" },
  { id: "ZAF", label: "South Africa" },
  { id: "KOR", label: "South Korea" },
  { id: "ESP", label: "Spain" },
  { id: "LKA", label: "Sri Lanka" },
  { id: "SDN", label: "Sudan" },
  { id: "SUR", label: "Suriname" },
  { id: "SWE", label: "Sweden" },
  { id: "CHE", label: "Switzerland" },
  { id: "SYR", label: "Syria" },
  { id: "TJK", label: "Tajikistan" },
  { id: "TZA", label: "Tanzania" },
  { id: "THA", label: "Thailand" },
  { id: "TGO", label: "Togo" },
  { id: "TTO", label: "Trinidad and Tobago" },
  { id: "TUN", label: "Tunisia" },
  { id: "TUR", label: "Turkey" },
  { id: "TKM", label: "Turkmenistan" },
  { id: "UGA", label: "Uganda" },
  { id: "UKR", label: "Ukraine" },
  { id: "ARE", label: "United Arab Emirates" },
  { id: "GBR", label: "United Kingdom" },
  { id: "USA", label: "United States of America" },
  { id: "URY", label: "Uruguay" },
  { id: "UZB", label: "Uzbekistan" },
  { id: "VUT", label: "Vanuatu" },
  { id: "VEN", label: "Venezuela" },
  { id: "VNM", label: "Vietnam" },
  { id: "YEM", label: "Yemen" },
  { id: "ZMB", label: "Zambia" },
  { id: "ZWE", label: "Zimbabwe" }
];
