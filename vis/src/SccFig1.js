// @flow
import * as React from "react";
import { scaleLinear } from "d3-scale";
import _range from "lodash/range";
import { Motion, spring } from "react-motion";
import Papa from 'papaparse';

type SSP = "SSP1" | "SSP2" | "SSP3" | "SSP4" | "SSP5";
type RCP = "rcp45" | "rcp60" | "rcp85";
type DMG =  "bhm_sr" | "bhm_richpoor_sr" | "bhm_lr" | "bhm_richpoor_lr" | "djo";
type CSVRow = {|
  run: string,
  dmgfuncpar: DMG,
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
        [curr["run"]]: curr
      }),
      {}
    );

const Scales = ({ min, max, scaler, slices = 5 }) => {
  const sliceWidth = Math.floor((max - min) / slices);
  const ticks = _range(Math.floor(min), Math.ceil(max), sliceWidth);
  return (
    <g>
      <line y1={290} y2={290} stroke="#aaa" x1={0} x2={400} />
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
                y1={287}
                y2={290}
                stroke="#aaa"
              />
              <text
                className="tickLabel"
                x={values.x}
                y={295}
                textAnchor="middle"
              >
                {t}
              </text>
            </React.Fragment>
          )}
        </Motion>
      ))}
    </g>
  );
};

const minMax = data => {
  let min, max;
  data.forEach(row => {
    const d = [row['16.7%'], row['83.3%']];
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
    return (slice[0]['83.3%'] - slice[0]['16.7%']) * 20;
  } else {
    // return 10k as default if this fails (which should error out)
    console.log(`unable to find a max bounds for ${data[0] && data[0].ISO3}`);
    return 10000;
  }
};

const SCCFigure = ({
  country,
  data,
  clamp
}: {
  country: string,
  data: *,
  clamp: number
}) => {
  const { min, max } = minMax(data);
  const inferred = inferredClamp(data);
  const maxActual = clamp !== undefined ? clamp : Math.min(inferred, max);

  const scaler = scaleLinear()
    .clamp(true) // clamp b/c values may be negative
    .domain([min, maxActual])
    .range([10, 390]);

  return (
    <svg viewBox="0 0 400 320" width="400" height="320">
      {["SSP1", "SSP2", "SSP3", "SSP4", "SSP5"].map((ssp, i) => (
        <g key={ssp} transform={`translate(0,${i * 60})`}>
          <DamageGroup ssp={ssp} data={data} scaler={scaler} />
        </g>
      ))}
      <Scales min={min} max={maxActual} scaler={scaler} />
      <text className="fig1-attr" x={400} y={310} textAnchor="end">
        Ricke et al. Country-level social cost of carbon. (2018).
      </text>
    </svg>
  );
};
export default SCCFigure;

const DamageGroup = ({ ssp, data, scaler }) => {
  return ["rcp45", "rcp60", "rcp85"].map((rcp, j) => (
    <g
      key={rcp}
      transform={`translate(0,${j * 15})`}
      onMouseEnter={() => console.log({ rcp, ssp })}
      className={[rcp, ssp, "scc"].join(" ")}
    >
      <DamageFigure
        rcp={rcp}
        ssp={ssp}
        data={dataForParams(data, ssp, rcp)}
        scaler={scaler}
      />
    </g>
  ));
};

type Props = {
  rcp: string,
  ssp: string,
  data: CSVRow,
};
class DamageFigure extends React.Component<Props> {
  render() {
    const { rcp, data, ssp, scaler } = this.props;
    const damage_functions = [
      "bhm_sr",
      "bhm_richpoor_sr",
      "bhm_lr",
      "bhm_richpoor_lr",
      "djo"
    ];

    return damage_functions.map((fn, idx) => {
      const row = data[fn];

      const x1 = scaler(row['16.7%']);
      const x2 = scaler(row['83.3%']);

      const median = scaler(row['50%']);

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
                  y1={idx * 2}
                  y2={idx * 2}
                />

                <circle
                  cx={value.median || 0}
                  cy={idx * 2}
                  r={1}
                  className={fn}
                />
              </React.Fragment>
            )}
          </Motion>
        </React.Fragment>
      );
    });
  }
}

type CSVFig1Props = {
  country: string,
  csvPath?: string,
  children: React.Node<*>
};

type CSVFig1State = {
  data: Array<CSVRow>,
  loading: boolean
};
class CSVFig1Loader extends React.PureComponent<CSVFig1Props, CSVFig1State> {
  state = {
    data: [],
    loading: false
  };
  static defaultProps = {
    csvPath: `${process.env.PUBLIC_URL}/cscc_v1.csv`,
    country: "WLD"
  };

  fetchData = () => {
    const data = [];
    const { ssp, rcp, dmg, prtp, eta, dmgfuncpar, climate } = this.props;
    const test = row =>
      row.ISO3 === this.props.country && row.eta === "1p5" && row.prtp === "2";
    this.setState({ loading: true });
    Papa.parse(this.props.csvPath, {
      download: true,
      header: true,
      dynamicTyping: name => ["16.7%", "50%", "83.3%"].includes(name),
      step: (results, parser) => {
        const row = results.data[0];
        // console.log(row.ISO3, this.props.country)
        if (test(row)) {
          data.push(row);
          console.log('huh')
        }
      },
      complete: () => {
        console.log({data})
        this.setState({ data, loading: false });
      }
    });
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.country !== this.props.country) {
      this.fetchData();
    }
  }

  render() {
    const { data, loading } = this.state;

    return this.props.children({ data, loading });
  }
}

export class Fig1Options extends React.Component<>{
  state={
    data: [],
    country: 'WLD',
  };

  render() {
    const {country} = this.state;
    return <div>
      <CSVFig1Loader country={country}>
        {({data, loading}) => {console.log(data); return <SCCFigure data={data} country={country} />}}
        {/* <SCCFigure data={data} country={country} /> */}
      </CSVFig1Loader>
    </div>;
  }
}