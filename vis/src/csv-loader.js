// @flow

import * as React from 'react'
import Papa from 'papaparse'

type CSVLoaderProps<Row> = {
  test: (row: Row) => boolean,
  dynamicTyping: (columnName: string) => boolean,
  csvPath: string,
  onChange?: (state: CSVLoaderState<*>) => any,
  children: ({data: Array<Row>, loading: boolean}) => React.Node
};

type CSVLoaderState<Out> = {
  data: Array<Out>,
  loading: boolean
};

class CSVLoader<Row, Out> extends React.PureComponent<
  CSVLoaderProps<Row>,
  CSVLoaderState<Out>
> {
  state = {
    data: [],
    loading: false
  };

  static defaultProps = {
    csvPath: `${process.env.PUBLIC_URL || ''}/cscc_v1.csv`,
    dynamicTyping: (name: string) => ["16.7%", "50%", "83.3%"].includes(name),
    test: (row: Row) => true,
    onChange: () => {},
  };

  fetchData = () => {
    const data = [];
    this.setState ({ loading: true }, () => this.props.onChange(this.state));
    Papa.parse(this.props.csvPath, {
      download: true,
      header: true,
      dynamicTyping: this.props.dynamicTyping,
      step: (results, parser) => {
        const row = results.data[0];
        if (this.props.test(row)) {
          data.push(row);
        }
      },
      complete: () => {
        this.setState({ data, loading: false }, () => this.props.onChange(this.state));
      }
    });
  };

  getData = () => {
    const {data, loading} = this.state;
    return {data, loading};
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.csvPath !== this.props.csvPath) {
      this.fetchData();
    }
    if (prevProps.test !== this.props.test) {
      this.fetchData();
    }
  }

  render() {
    const { data, loading } = this.state;

    return this.props.children ? this.props.children({ data, loading }) : null;
  }
}

export default CSVLoader;
