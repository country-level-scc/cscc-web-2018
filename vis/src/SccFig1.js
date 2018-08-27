// @flow
import React from "react";
import { scaleLinear } from "d3-scale";
import _range from "lodash/range";
import { Motion, spring } from "react-motion";

const dataForParams = (data, ssp, rcp) =>
  data
    .filter(row => row.scenario === ssp)
    .filter(row => row.rcp === rcp)
    .reduce(
      (prev, curr) => ({
        ...prev,
        [curr["damage_fn"]]: curr
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
    const d = [row.estimates[0], row.estimates[2]];
    min = min ? Math.min(min, ...d) : Math.min(...d);
    max = max ? Math.max(max, ...d) : Math.max(...d);
  });
  return { min, max };
};

const inferredClamp = data => {
  const slice = data
    .filter(row => row.rcp === "rcp60")
    .filter(row => row.scenario === "SSP2")
    .filter(row => row.damage_fn === "bhm_sr");
  if (slice.length === 1) {
    return (slice[0].estimates[2] - slice[0].estimates[0]) * 20;
  } else {
    // return 10k as default if this fails (which should error out)
    console.error(`unable to find a max bounds for ${data[0].ISO3}`)
    return 10000;
  }
};

const SCCFigure = ({ country, data, clamp }: {country: string, data: *, clamp: number }) => {
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
  data: { [key: string]: {} }
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

      const x1 = scaler(row.estimates[0]);
      const x2 = scaler(row.estimates[2]);

      const median = scaler(row.estimates[1]);

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
