import os, sys
import os.path
import argparse

import tablib


SSPS = ['SSP1', 'SSP2', 'SSP3', 'SSP4', 'SSP5']
DMGS = ['bhm_sr', 'bhm_richpoor_sr', 'bhm_lr', 'bhm_richpoor_lr', 'djo']
RCPS = ['rcp45', 'rcp60', 'rcp85']

def extract_all_csvs(dataset, output_dir):
  headers = dataset.headers

  for ssp in SSPS:
    for dmg in DMGS:
      for rcp in RCPS:
        filtered = filter_csv(dataset, rcp, dmg, ssp, headers)
        filtered.headers = headers
        export_filtered_csv(filtered, rcp, dmg, ssp, output_dir)

def filter_csv(dataset, rcp, dmg, ssp, headers):
  extracted = tablib.Dataset()
  idx = lambda key: headers.index(key)

  for row in dataset:
    if row[idx('RCP')] == rcp and row[idx('run')] == dmg and row[idx('SSP')] == ssp:
      extracted.append(row)
  return extracted

def export_filtered_csv(dataset, rcp, dmg, ssp, output_dir):
  filename = os.path.join(output_dir,'rcp_%s_dmg_%s_ssp_%s.csv' % (rcp, dmg, ssp))
  with open(filename, 'w') as f:
    print 'writing %s' % filename
    f.write(dataset.export('csv'))

def extract_country_csvs(dataset, output_dir):
  headers = dataset.headers
  countries = list(set(dataset['ISO3']))
  print "extracting %d countries" % len(countries)
  for country in countries:
    filtered = filter_country(dataset, country, headers)
    filtered.headers = headers
    export_country_csv(filtered, country, output_dir)

def filter_country(dataset, country, headers):
  extracted = tablib.Dataset()
  idx = lambda key: headers.index(key)

  for row in dataset:
    if row[idx('ISO3')] == country:
      extracted.append(row)
  return extracted

def export_country_csv(dataset, country, output_dir):
  filename = os.path.join(output_dir, 'iso3_%s.csv' % country)
  with open(filename, 'w') as f:
    print 'writing %s' % filename
    f.write(dataset.export('csv'))

if __name__ == '__main__':
  parser = argparse.ArgumentParser(description='extract data into a file')

  parser.add_argument('csv', help='a path to a csv with data')
  parser.add_argument('--dest',  help='where to write files to', default='sourcedata/filtered')

  args = parser.parse_args()

  if args.csv.endswith('csv'):
    dataset = tablib.Dataset().load(open(args.csv).read())
    extract_all_csvs(dataset, args.dest)
    extract_country_csvs(dataset, args.dest)

  else:
    print 'call\n  python all_csvs.py ../cscc_v2.csv'
