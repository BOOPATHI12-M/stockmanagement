# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests clean package

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Folder for SQLite + uploads (NOTE: persistent only if Render disk is attached)
RUN mkdir -p /opt/render/project/data/uploads/products

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Don't hardcode profile; Render env vars should control it
ENTRYPOINT ["java", "-jar", "app.jar"]
