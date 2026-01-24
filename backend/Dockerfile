# Multi-stage Dockerfile for Spring Boot on Render

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17-alpine AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Create directory for SQLite database and uploads
RUN mkdir -p /opt/render/project/data/uploads/products

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port (Render will set PORT env variable)
EXPOSE 8080

# Run the application
# Use exec form to ensure proper signal handling
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
