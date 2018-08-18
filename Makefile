SCRATCH_DIR = scratch

scratchdir:
	mkdir -p $(SCRATCH_DIR)

co2e.zip: scratchdir
	curl -o '$(SCRATCH_DIR)/co2e.zip' 'http://api.worldbank.org/v2/en/indicator/EN.ATM.CO2E.KT?downloadformat=csv'

API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv: co2e.zip
	unzip -d $(SCRATCH_DIR) -u '$(SCRATCH_DIR)/co2e.zip'
	touch '$(SCRATCH_DIR)/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv'

co2e-with-headers.csv: API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv
	sed -e 1,4d < $(SCRATCH_DIR)/API_EN.ATM.CO2E.KT_DS2_en_csv_v2_10051706.csv > $(SCRATCH_DIR)/co2e-with-headers.csv

co2e-latest.csv: co2e-with-headers.csv
	python scripts/clean-emissions.py $(SCRATCH_DIR)/co2e-with-headers.csv > sourcedata/co2e-latest.csv