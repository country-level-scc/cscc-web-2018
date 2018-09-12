// @flow

import * as React from "react";
import { SSPS, DMGS, RCPS } from "./constants";

type ParamState = {
  ssp: string,
  rcp: string,
  dmg: string,
  discounting: () => any
};

type ParamProps = {
  children: ({state: ParamState}) => React.Node,
};

export default class ParameterPicker extends React.Component<
  ParamProps,
  ParamState
> {
  state = {
    ssp: "SSP2",
    rcp: "rcp60",
    dmg: "bhm_sr",
    discounting: 'fixed',
  };

  static defaultProps = { callback: () => {} };

  update = evt => {
    this.setState({ [evt.currentTarget.name]: evt.currentTarget.value });
  };

  render() {
    return (
      <div>
        <div className="param-picker">
          <div className="param-picker-row">
            <select name="ssp" value={this.state.ssp} onChange={this.update}>
              {SSPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select name="rcp" value={this.state.rcp} onChange={this.update}>
              {RCPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select name="dmg" value={this.state.dmg} onChange={this.update}>
              {DMGS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select
              name="discounting" value={this.state.discounting}
              onChange={this.update}
            >
              {["fixed", "growth adjusted"].map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="param-picker-descs">
            <div>
              shared socioeconomic pathway scenarios
            </div>
            <div>
              Representative Concentration Pathway
            </div>
            <div>
              Damage Model
            </div>
            <div>
              Discounting<br /> {this.state.discounting === 'fixed' && <React.Fragment>Pure rate of time preference of 2% per year and an
206 inter-temporal elasticity of substitution of 1.5</React.Fragment>}
            </div>

          </div>
        </div>
        {this.props.children &&
          this.props.children({
            state: this.state
          })}
      </div>
    );
  }
}
