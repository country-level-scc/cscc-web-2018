// @flow

import * as React from 'react';
import {SSPS, DMGS, RCPS} from './constants';

type ParamProps = {
  children: ({state: ParamState}) => React.Node,
  onChange: ({state: ParamState}) => any,
  params: {
    ssp: string,
    rcp: string,
    dmg: string,
    discounting: string,
  },
};

export default class ParameterPicker extends React.Component<ParamProps> {
  static defaultProps = {
    params: {
      ssp: 'SSP2',
      rcp: 'rcp60',
      dmg: 'bhm_sr',
      discounting: 'growth adjusted',
    },
    callback: () => {},
  };

  update = evt => {
    this.props.onChange({state: {
      ...this.props.params,
      [evt.currentTarget.name]: evt.currentTarget.value,
    }});
  };

  render() {
    return (
      <div>
        <div className="param-picker">
          <div className="param-picker-row">
            <select
              name="ssp"
              value={this.props.params.ssp}
              onChange={this.update}
            >
              {SSPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select
              name="rcp"
              value={this.props.params.rcp}
              onChange={this.update}
            >
              {RCPS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select
              name="dmg"
              value={this.props.params.dmg}
              onChange={this.update}
            >
              {DMGS.map(ssp => (
                <option key={ssp.value} value={ssp.value}>
                  {ssp.label}
                </option>
              ))}
            </select>
            <select
              name="discounting"
              value={this.props.params.discounting}
              onChange={this.update}
            >
              {['fixed', 'growth adjusted'].map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="param-picker-descs">
            <div>
              Socioeconomic Scenario <br />
              Shared Socioeconomic Pathway (SSPs)
            </div>
            <div>
              Emissions Scenario<br />
              Representative Concentration Pathway (RCPs)
            </div>
            <div>Damage Model</div>
            <div>
              Discounting Scheme<br />{' '}
              {this.props.params.discounting === 'fixed' && (
                <React.Fragment>
                  Pure rate of time preference of 2% per year and an 206
                  inter-temporal elasticity of substitution of 1.5
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
        {this.props.children &&
          this.props.children({
            state: this.props.params,
          })}
      </div>
    );
  }
}
