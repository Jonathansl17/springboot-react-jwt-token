import json, sys
path, tc = sys.argv[1], sys.argv[2]
with open(path) as f:
    d = json.load(f)
d['_tc'] = tc
print(json.dumps(d))
