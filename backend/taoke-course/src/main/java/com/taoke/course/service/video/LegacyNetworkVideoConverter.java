package com.taoke.course.service.video;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 优酷/土豆/腾讯视频手机端播放地址转换（对齐老站 tk_video::getNetworkUrl Mobile）。
 */
@Component
public class LegacyNetworkVideoConverter {

    private static final List<ReplacementRule> MOBILE_RULES = List.of(
            rule("http://player.youku.com/player.php/sid/(\\S+)/v.swf", "http://player.youku.com/embed/$1"),
            rule("http://player.youku.com/player.php/Type/Folder/Fid/(\\d+)/(\\S+)/(\\d+)/sid/(\\S+)/v.swf",
                    "http://player.youku.com/embed/$4"),
            rule("http://i.youku.com/u/videos/edit/id_(\\S+).html(\\S*)", "http://player.youku.com/embed/$1"),
            rule("http://player.youku.com/embed/videos/edit/id_(\\S+).html(\\S*)", "http://player.youku.com/embed/$1"),
            rule("http://i.youku.com/u/(\\S+)/", "http://player.youku.com/embed/$1"),
            rule("http://p.youku.com/p.php/sid/(\\S+)/v.swf", "http://player.youku.com/embed/$1"),
            rule("http://p.youku.com/p.php/Type/Folder/Fid/(\\d+)/(\\S+)/(\\S+)/sid/(\\S+)/v.swf",
                    "http://player.youku.com/embed/$4"),
            rule("http://v.youku.com/v_show/id_(\\S+)==.html(\\S*)", "http://player.youku.com/embed/$1"),
            rule("http://www.tudou.com/programs/view/(\\S+)/(\\S*)",
                    "http://www.tudou.com/programs/view/html5embed.action?code=$1"),
            rule("http://www.tudou.com/v/(\\S+)/&resourceId=(\\S*)",
                    "http://www.tudou.com/programs/view/html5embed.action?code=$1"),
            rule("http://www.tudou.com/a/(\\S+)/&resourceId=(\\S*)",
                    "http://www.tudou.com/programs/view/html5embed.action?code=$1"),
            rule("http://www.tudou.com/v/(\\S+)/&rpid=(\\d+)&resourceId=(\\S*)",
                    "http://www.tudou.com/programs/view/html5embed.action?code=$1"),
            rule("http://static.video.qq.com/TPout.swf\\?vid=(\\S+)", "http://v.qq.com/iframe/player.html?vid=$1"),
            rule("http://v.qq.com/page/(\\S+)/(\\S+)/(\\S+)/(\\S+).html(\\S*)",
                    "http://v.qq.com/iframe/player.html?vid=$4"),
            rule("http://v.qq.com/boke/page/(\\S+)/(\\S+)/(\\S+)/(\\S+).html(\\S*)",
                    "http://v.qq.com/iframe/player.html?vid=$4"),
            rule("http://v.youku.com/v_show/id_(\\S+).html(\\S*)", "http://player.youku.com/embed/$1"),
            rule("http://player.youku.com/embed/(\\S+)", "http://player.youku.com/embed/$1")
    );

    public String convertForMobile(String videoUrl) {
        if (videoUrl == null || videoUrl.isBlank()) {
            return videoUrl;
        }
        String current = videoUrl.trim();
        for (ReplacementRule rule : MOBILE_RULES) {
            Matcher matcher = rule.pattern.matcher(current);
            if (matcher.find()) {
                return matcher.replaceAll(rule.replacement);
            }
        }
        return current;
    }

    public boolean isNetworkEmbedUrl(String videoUrl) {
        if (videoUrl == null || videoUrl.isBlank()) {
            return false;
        }
        String lower = videoUrl.toLowerCase();
        return lower.contains("youku.com") || lower.contains("tudou.com") || lower.contains("qq.com")
                || lower.contains("static.video.qq.com");
    }

    private static ReplacementRule rule(String source, String target) {
        return new ReplacementRule(Pattern.compile(source, Pattern.CASE_INSENSITIVE), target);
    }

    private record ReplacementRule(Pattern pattern, String replacement) {
    }
}
