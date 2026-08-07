# Task 9 Report — 内训价格迁移三态（§75）

## Changes
1. **`map_course_prices`** — OPEN 保持原逻辑；INTERNAL 有价保留 `price`/`original_price`/`is_free=0`，无价 → `price=0, original_price=0, is_free=0`（待定，不再误标免费）
2. **`build_course_row`** — 使用 `map_course_prices`，内训不再强制清零 price
3. **`fixup_internal_course_price_pending.py`** — 从老库重算 INTERNAL 的 `price`/`original_price`/`is_free` 并 UPDATE

## Legacy free-marker audit
- 检索 `tk_courseinfo`/`tk_coursedata`/`tk_course` 及 audit 列清单：**无明确 is_free/免费 字段**
- `tk_course` 仅有 `price`/`special_price`/`store_price_text`（文本价，非布尔免费标）
- 结论：零价/缺价内训保持 `is_free=0`

## Verification
- `uv run python -m unittest data-trans.tests.test_legacy_course_master_and_production_migrate` — 6 passed
- DB dry-run：未连测试库（需 DSN）

## Run fixup
```bash
# dry-run（默认）
uv run python data-trans/scripts/fixup_internal_course_price_pending.py \
  --source-dsn "$OLD_MYSQL_DSN" --target-dsn "$NEW_MYSQL_DSN"

# 实写
uv run python data-trans/scripts/fixup_internal_course_price_pending.py \
  --source-dsn "$OLD_MYSQL_DSN" --target-dsn "$NEW_MYSQL_DSN" --apply
```

## Status
**DONE** — migration + fixup committed; test DB dry-run/apply pending DSN
