from scholarly import scholarly
import json
from datetime import datetime, timezone
import os

author: dict = scholarly.search_author_id(os.environ['GOOGLE_SCHOLAR_ID'])
scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
if not author.get('publications'):
    raise RuntimeError('No publications returned; retaining the last successful statistics.')
author['updated'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
author['publications'] = {v['author_pub_id']:v for v in author['publications']}
print(f"Fetched statistics for {len(author['publications'])} publications.")
os.makedirs('results', exist_ok=True)
with open(f'results/gs_data.json', 'w') as outfile:
    json.dump(author, outfile, ensure_ascii=False)

shieldio_data = {
  "schemaVersion": 1,
  "label": "citations",
  "message": f"{author['citedby']}",
}
with open(f'results/gs_data_shieldsio.json', 'w') as outfile:
    json.dump(shieldio_data, outfile, ensure_ascii=False)
