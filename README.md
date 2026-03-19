# PublicMapping

YIMBY Alliance public-facing maps. Next.js app with Mapbox GL JS.

## Mapbox Tilesets

Map layers use Mapbox vector tilesets hosted under the `freddie-yimby` account. Tileset definitions and upload tooling live in the sibling **yimby-data** repo.

### Tilesets used by the overcrowding map

| Tileset ID | YAML definition | Description |
|---|---|---|
| `freddie-yimby.overcrowding_constituencies` | `mts-defs/overcrowding-constituencies.yaml` | Constituency boundaries with overcrowding stats |
| `freddie-yimby.overcrowding_msoa` | `mts-defs/overcrowding-msoa.yaml` | MSOA-level detail layer |

### Re-uploading a tileset

From the **yimby-data** repo root:

```bash
# Preview what will be uploaded
uv run python tools/mapbox-tools.py --defs mts-defs/<definition>.yaml show

# Full run: delete old source, update recipe, and publish
# (interactive — prompts for confirmation at each step)
uv run python tools/mapbox-tools.py --defs mts-defs/<definition>.yaml run <key>

# Non-interactive (e.g. for the constituency tileset):
# Note: must delete source separately as Mapbox CLI requires interactive confirmation
uv run tilesets delete-source freddie-yimby <source_id> --force
uv run python tools/mapbox-tools.py \
  --defs mts-defs/<definition>.yaml \
  run <key> --update-recipe --publish --no-prompt
```

The tool reads `.env` in `yimby-data/` for `MAPBOX_TOKEN`. Source GeoJSON files live in `yimby-data/processed-files/`.

### Adjusting geometry simplification

Tileset YAMLs support a `simplify` parameter (tolerance in source CRS units — degrees for EPSG:4326). This is applied before upload using `shapely.simplify(preserve_topology=True)`. Mapbox MTS applies additional per-zoom simplification during tiling.

Example: `simplify: 0.001` in `overcrowding-constituencies.yaml` gives ~111m tolerance, reducing vertices by ~67%.
