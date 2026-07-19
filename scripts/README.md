# PDF → content pipeline (private use)

1. Put paths in `.env.local` (`PHB_PDF_PATH`, `MM_PDF_PATH`) or pass them as CLI args.
2. Extract raw text:

```bash
npm run extract:phb
npm run extract:mm
```

Output goes to `raw/phb/` and `raw/mm/` (gitignored): per-page `.txt`, `full.txt`, and `index.json`.

3. Search the raw dump (e.g. spell names, monster headings) and build JSON matching the Zod schemas in `src/lib/types.ts`.

4. Merge / validate:

```bash
npx tsx scripts/curate-from-raw.ts spells staging/spells.partial.json
npx tsx scripts/curate-from-raw.ts monsters staging/my-monster.json
npx tsx scripts/curate-from-raw.ts validate-all
```

Tables in rulebook PDFs often extract poorly — hand-edit JSON after merge.

## Coverage checklist

- [ ] Spells
- [ ] Monsters
- [ ] Classes
- [ ] Species
- [ ] Backgrounds
- [ ] Feats
- [ ] Weapons
- [ ] Equipment
- [ ] How to play / character creation guides
