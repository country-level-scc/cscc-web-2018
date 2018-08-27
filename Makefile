SCRATCH_DIR = scratch

scratch:
	mkdir -p $(SCRATCH_DIR)

scratch/co2e.zip: scratch
	curl -o '$(SCRATCH_DIR)/co2e.zip' 'http://api.worldbank.org/v2/en/indicator/EN.ATM.CO2E.KT?downloadformat=csv'

scratch/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv: scratch/co2e.zip
	unzip -d $(SCRATCH_DIR) -u '$(SCRATCH_DIR)/co2e.zip'
	touch '$(SCRATCH_DIR)/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv'

sourcedata/co2e-with-headers.csv: scratch/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv
	sed -e 1,4d < $(SCRATCH_DIR)/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv > sourcedata/co2e-with-headers.csv

sourcedata/co2e-latest.csv: sourcedata/co2e-with-headers.csv
	python scripts/clean-emissions.py $(SCRATCH_DIR)/co2e-with-headers.csv > sourcedata/co2e-latest.csv


# shapefiles for map
scratch/ne_110m_admin_0_countries.zip: scratch
	curl -L -o $(SCRATCH_DIR)/ne_110m_admin_0_countries.zip https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_countries.zip

scratch/ne_110m_admin_0_countries.shp: scratch/ne_110m_admin_0_countries.zip
	unzip -d $(SCRATCH_DIR) -u '$(SCRATCH_DIR)/ne_110m_admin_0_countries.zip'
	touch $@

scratch/ne_110m_geo.json: scratch/ne_110m_admin_0_countries.shp
	./vis/node_modules/.bin/shp2json scratch/ne_110m_admin_0_countries.shp -o $@

scratch/ne_110m_geo.ndjson: scratch/ne_110m_geo.json
	./vis/node_modules/.bin/ndjson-split 'd.features' < scratch/ne_110m_geo.json > $@

scratch/ne_110m_min_geo.ndjson: scratch/ne_110m_geo.ndjson
	./vis/node_modules/.bin/ndjson-map 'd.properties = {id: d.properties.ADM0_A3_US, label: d.properties.NAME}, d' < scratch/ne_110m_geo.ndjson | ./vis/node_modules/.bin/ndjson-filter '!["GRL", "ATA"].includes(d.properties.id)' > $@

scratch/ne_110_min.json: scratch/ne_110m_min_geo.ndjson
	./vis/node_modules/.bin/ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' < scratch/ne_110m_min_geo.ndjson  > $@

scratch/ne_110_topo_quant.json: scratch/ne_110m_min_geo.ndjson
	./vis/node_modules/.bin/geo2topo -n countries=scratch/ne_110m_min_geo.ndjson > scratch/ne_110_topo.json
	# ./vis/node_modules/.bin/toposimplify -p 1 < scratch/ne_110_topo.json > scratch/ne_110_topo_simple.json
	./vis/node_modules/.bin/topoquantize 1e5 < scratch/ne_110_topo.json > $@

vis/src/ne_110_topo_quant.json: scratch/ne_110_topo_quant.json
	cp scratch/ne_110_topo_quant.json $@