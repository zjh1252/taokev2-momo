# ============================================================
# 后端服务 — 多阶段构建
# 构建阶段使用 Maven + JDK 21 编译打包
# 运行阶段使用 JRE 21 精简镜像
# ============================================================

ARG TEMURIN_JDK=eclipse-temurin:21-jdk
ARG TEMURIN_JRE=eclipse-temurin:21-jre

# ---------- 阶段1：Maven 构建 ----------
FROM --platform=$BUILDPLATFORM ${TEMURIN_JDK} AS builder

WORKDIR /build

# 先复制 pom 利用 Docker 缓存层加速依赖下载
COPY backend/pom.xml ./pom.xml
COPY backend/taoke-common/pom.xml ./taoke-common/pom.xml
COPY backend/taoke-user/pom.xml ./taoke-user/pom.xml
COPY backend/taoke-course/pom.xml ./taoke-course/pom.xml
COPY backend/taoke-admin/pom.xml ./taoke-admin/pom.xml
COPY backend/taoke-app/pom.xml ./taoke-app/pom.xml

RUN --mount=type=cache,target=/root/.m2 \
    apt-get update && apt-get install -y maven && \
    mvn dependency:go-offline -B -q || true

# 复制全部源码并打包
COPY backend/ ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -B -q && \
    mv taoke-app/target/taoke-app-*.jar app.jar

# ---------- 阶段2：运行镜像 ----------
ARG TEMURIN_JRE=eclipse-temurin:21-jre
FROM --platform=$TARGETPLATFORM ${TEMURIN_JRE}

LABEL maintainer="Fangxinxin"
LABEL description="淘课网 v2 后端服务"

WORKDIR /app

COPY --from=builder /build/app.jar app.jar

# 默认时区为上海
ENV TZ=Asia/Shanghai
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar ${0} ${@}"]
