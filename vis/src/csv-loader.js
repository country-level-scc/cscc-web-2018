// @flow

import * as React from 'react'
import Papa from 'papaparse'

type CSVLoaderProps<Row> = {
  test: (row: Row) => boolean,
  csvPath: string,
  children: React.Node<*>
};

type CSVLoaderState<Out> = {
  data: Array<Out>,
  loading: boolean
};

class CSVLoader<Row, Out> extends React.PureComponent<CSVLoaderProps<Row>, CSVLoaderState<Out>> {
  state = {
    data: [],
    loading: false
  };

  static defaultProps = {
    csvPath: `${process.env.PUBLIC_URL}/cscc_v1.csv`,
  };

  fetchData = () => {
    const data = [];
    const { country } = this.props;
    this.setState({ loading: true });
    Papa.parse(this.props.csvPath, {
      download: true,
      header: true,
      dynamicTyping: name => ["16.7%", "50%", "83.3%"].includes(name),
      step: (results, parser) => {
        const row = results.data[0];
        // console.log(row.ISO3, this.props.country)
        if (this.props.test(row)) {
          data.push(row);
        }
      },
      complete: () => {
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

export default CSVLoader;