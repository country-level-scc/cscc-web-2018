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
    // discounting: ParameterPicker.fixedDiscounting
  };

  static defaultProps = { callback: () => {} };

  update = evt => {
    this.setState({ [evt.currentTarget.name]: evt.currentTarget.value });
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

  render() {
    return (
      <div>
        <div>
          <div>
            <select name="ssp" onChange={this.update}>
              {SSPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select name="rcp" onChange={this.update}>
              {RCPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select name="dmg" onChange={this.update}>
              {DMGS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select
              name="discounting"
              onChange={this.update}
            >
              {["fixed", "growth adjusted"].map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
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
