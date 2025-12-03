# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["StudyHub.Backend.Api/StudyHub.Backend.Api.csproj", "StudyHub.Backend.Api/"]
COPY ["StudyHub.Backend.Infrastructure.MongoDb/StudyHub.Backend.Infrastructure.MongoDb.csproj", "StudyHub.Backend.Infrastructure.MongoDb/"]
COPY ["StudyHub.Backend.UseCases/StudyHub.Backend.UseCases.csproj", "StudyHub.Backend.UseCases/"]
COPY ["StudyHub.Backend.Domain/StudyHub.Backend.Domain.csproj", "StudyHub.Backend.Domain/"]
COPY ["StudyHub.Backend.Infrastructure/StudyHub.Backend.Infrastructure.csproj", "StudyHub.Backend.Infrastructure/"]
RUN dotnet restore "./StudyHub.Backend.Api/StudyHub.Backend.Api.csproj"
COPY . .
WORKDIR "/src/StudyHub.Backend.Api"
RUN dotnet build "./StudyHub.Backend.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./StudyHub.Backend.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StudyHub.Backend.Api.dll"]