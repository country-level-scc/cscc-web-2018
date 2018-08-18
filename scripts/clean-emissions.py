import os, sys

import tablib

def extract_emissions(path):
  data = tablib.Dataset().load(open(path).read())
  cols_to_keep = ['Country Name', 'Country Code', '2014']

  cleaned = tablib.Dataset()

  for col in cols_to_keep:
    column = data.get_col(data.headers.index(col))
    cleaned.append_col(column, header=col)
  
  cleaned.headers = cols_to_keep
  print cleaned.export('csv')

if __name__ == '__main__':
  if sys.argv[-1].endswith('csv'):
    extract_emissions(sys.argv[-1])
  else:
    print 'call with a csv file as the only argument'