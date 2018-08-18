#scc data vis


## python
**virtualenv**

    virtualenv --no-site-packages env
    pip install -r requirements.txt

### upgrading python deps
if you are adding a new package, update `requirements-to-freeze.txt` and then `pip install -r requirements-to-freeze.txt --upgrade && pip freeze > requirements.txt`

## make
there's a makefile here which you can use to download the latest co2 emissions data and clean it up for use:

    make sourcedata/co2e-latest.csv

it will write the file to `sourcedata/co2e-latest.csv`