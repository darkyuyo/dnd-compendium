Drop curated JSON partials here, then merge:

```bash
npx tsx scripts/curate-from-raw.ts spells staging/spells.partial.json
npx tsx scripts/curate-from-raw.ts monsters staging/my-monster.json
npx tsx scripts/curate-from-raw.ts validate-all
```
