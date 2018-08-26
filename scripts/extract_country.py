import os, sys
import argparse

import tablib


def extract_country(data, iso_code, prtp='2', eta='1p5'):
  """extract country data with prtp and etas specified
  
  may not be necessary if you can stream the csv directly
  """
  extracted = tablib.Dataset()
  headers = data.headers
  idx = lambda key: headers.index(key)
  for row in data:
    if row[idx('ISO3')] == iso_code and row[idx('prtp')] == prtp and row[idx('eta')] == eta:
      extracted.append(row)
  print extracted.export('csv')


if __name__ == '__main__':
  parser = argparse.ArgumentParser(description='extract data into a file')

  parser.add_argument('iso3', help='an iso3 country code')
  parser.add_argument('csv', help='a path to a csv with data')

  args = parser.parse_args()

  if args.csv.endswith('csv'):
    dataset = tablib.Dataset().load(open(args.csv).read())
    extract_country(dataset, args.iso3)

  else:
    print 'call\n  python extract_country.py USA cscc_v1.csv'