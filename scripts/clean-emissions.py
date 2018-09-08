import os, sys

import tablib

def extract_emissions(data):
  cols_to_keep = ['Country Name', 'Country Code', str(find_latest_emissions_year(data))]

  cleaned = tablib.Dataset()

  for col in cols_to_keep:
    column = data.get_col(data.headers.index(col))
    cleaned.append_col(column, header=col)

  cleaned.headers = cols_to_keep
  return cleaned

def extract_emissions_share(data):
  year = find_latest_emissions_year(data)
  print year
  total_for_latest = total_emissions(data, year)

  emissions = extract_emissions(data)
  share = []
  for row in emissions:
    if row[-1]:
      share.append(float(row[-1]) / total_for_latest)
    else:
      share.append(0)
  emissions.append_col(share, header='Emissions Share')

  return emissions


def find_latest_emissions_year(data):
  years = sorted([int(header) for header in data.headers if len(header) == 4])
  years.reverse()

  for year in years:
    if total_emissions(data, year) > 0:
      return year

def total_emissions(data, year):
  year_column = data.headers.index(str(year))
  code_column = data.headers.index('Country Code')
  for country in data:
    if country[code_column] == 'WLD' and country[year_column]:
      if country[year_column]:
        return float(country[year_column])
  return 0

if __name__ == '__main__':
  if sys.argv[-1].endswith('csv'):
    target = sys.argv[-1]
    dataset = tablib.Dataset().load(open(target).read())

    emissions = extract_emissions_share(dataset)
    print emissions.export('csv')
  else:
    print 'call with a csv file as the only argument'
