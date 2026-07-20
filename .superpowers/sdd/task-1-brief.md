### Task 1: 鍚庣璇剧▼/褰曟挱璇惧皝闈㈠惈鑽夌蹇呭～

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/CourseServiceImpl.java`锛坄create` / `update`锛?
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/video/VideoServiceImpl.java`锛坄create` / `update` / `validateForSubmit`锛?
- Test锛堝彲閫変絾鎺ㄨ崘锛? 鍦?`backend/taoke-course/src/test/java/...` 澧炲姞鑱氱劍鏍￠獙鐨勫崟娴嬶紝鎴栨墜宸ョ敤鎺ュ彛楠岃瘉

**Interfaces:**
- Consumes: `SaveCourseRequest.getCoverUrl()` / `SaveVideoRequest.getCoverUrl()` / `getDraft()`
- Produces: 绌虹櫧灏侀潰鏃?`BusinessException(ErrorCode.PARAM_INVALID, "璇蜂笂浼犺绋嬪皝闈?)`锛堝綍鎾鍙敤鍚屼竴鏂囨锛?

- [ ] **Step 1: 鎶藉嚭璇剧▼灏侀潰鏍￠獙骞跺湪 create/update 濮嬬粓璋冪敤**

鍦?`CourseServiceImpl` 澧炲姞绉佹湁鏂规硶锛?

```java
/** 灏侀潰蹇呭～锛堝惈鑽夌锛?*/
private void validateCoverRequired(SaveCourseRequest request) {
    if (request.getCoverUrl() == null || request.getCoverUrl().isBlank()) {
        throw new BusinessException(ErrorCode.PARAM_INVALID, "璇蜂笂浼犺绋嬪皝闈?);
    }
}
```

鍦?`create` / `update` 涓紝**鏃犺 draft**锛屽厛璋冪敤 `validateCoverRequired(request)`銆? 
淇濈暀 `validateForSubmit` 鍐呭皝闈㈡鏌ワ紙鎴栨敼涓鸿皟鐢ㄥ悓涓€鏂规硶锛夛紝閬垮厤鎻愪氦璺緞婕忔銆?

- [ ] **Step 2: 褰曟挱璇惧悓鏍峰己鍒跺皝闈?*

鍦?`VideoServiceImpl`锛?

```java
private void validateCoverRequired(SaveVideoRequest request) {
    if (request.getCoverUrl() == null || request.getCoverUrl().isBlank()) {
        throw new BusinessException(ErrorCode.PARAM_INVALID, "璇蜂笂浼犺绋嬪皝闈?);
    }
}
```

鍦?`create` / `update`锛堝強浠讳綍璧颁繚瀛樼殑鍏ュ彛锛夋棤璁?draft 閮借皟鐢ㄣ€? 
鍦?`validateForSubmit` 涓篃璋冪敤涓€娆★紙鎴栧悎骞讹級銆?

- [ ] **Step 3: 缂栬瘧鑷**

Run锛堝湪 `backend/`锛?

```bash
mvn -pl taoke-course -am compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/taoke-course/src/main/java/com/taoke/course/service/CourseServiceImpl.java \
  backend/taoke-course/src/main/java/com/taoke/course/service/video/VideoServiceImpl.java
git commit -m "$(cat <<'EOF'
fix: require course and video cover on draft save

EOF
)"
```

---

