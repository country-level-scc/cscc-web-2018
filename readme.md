#scc data vis


## python
virtualenv

    virtualenv --no-site-packages env
    pip install -r requirements.txt

### upgrading python deps
if you are adding a new package, update `requirements-to-freeze.txt` and then `pip install -r requirements-to-freeze.txt --upgrade && pip freeze > requirements.txt`

