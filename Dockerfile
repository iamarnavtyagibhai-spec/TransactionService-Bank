# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven files
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy source code and build jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S ninjabank && adduser -S ninjabank -G ninjabank
USER ninjabank

# Copy packaged jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
