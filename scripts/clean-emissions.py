import os, sys

import tablib

def extract_emissions(data):
  cols_to_keep = ['Country Name', 'Country Code', str(find_latest_emissions_year(data))]

  cleaned = tablib.Dataset()

  for col in cols_to_keep:
    column = data.get_col(data.headers.index(col))
    cleaned.append_col(column, header=col)
  
  cleaned.headers = cols_to_keep
  return cleaned.export('csv')

def find_latest_emissions_year(data):
  years = sorted([int(header) for header in data.headers if len(header) == 4])
  years.reverse()

  for year in years:
    col = data.get_col(data.headers.index(str(year)))
    float_col = [float(amount) if amount else 0 for amount in col]
    total = sum(float_col)
    if total > 0:
      return year

if __name__ == '__main__':
  if sys.argv[-1].endswith('csv'):
    target = sys.argv[-1]
    dataset = tablib.Dataset().load(open(target).read())
    
    print extract_emissions(dataset)
    # print find_latest_emissions_year(dataset)
  else:
    print 'call with a csv file as the only argument'