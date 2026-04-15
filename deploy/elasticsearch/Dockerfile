FROM 10.0.16.26:5000/taokev2/elasticsearch:8.19.13

# 下载 IK 中文分词插件到临时目录，再从本地文件安装（避免 plugin install 直接下载的网络问题）
ADD https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-8.19.13.zip /tmp/ik.zip
USER root
RUN chown elasticsearch:elasticsearch /tmp/ik.zip
USER elasticsearch
RUN bin/elasticsearch-plugin install --batch file:///tmp/ik.zip && rm /tmp/ik.zip
