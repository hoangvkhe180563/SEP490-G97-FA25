# Hướng dẫn chạy Unit Tests

## Các lệnh chạy test

### 1. Chạy tất cả tests

```powershell
cd "d:\Term 9\Capstone project\Code\SEP490-G97-FA25\StudyHub.Backend\StudyHub.Backend.UseCases.Tests"
dotnet test
```

### 2. Chạy tests với verbosity cao hơn

```powershell
dotnet test --verbosity normal
```

hoặc

```powershell
dotnet test --verbosity detailed
```

### 3. Chạy tests của một service cụ thể

**CourseService:**

```powershell
dotnet test --filter "FullyQualifiedName~CourseServiceTests"
```

**LectureService:**

```powershell
dotnet test --filter "FullyQualifiedName~LectureServiceTests"
```

**EnrollmentService:**

```powershell
dotnet test --filter "FullyQualifiedName~EnrollmentServiceTests"
```

**PaymentService:**

```powershell
dotnet test --filter "FullyQualifiedName~PaymentServiceTests"
```

### 4. Chạy một test method cụ thể

```powershell
dotnet test --filter "FullyQualifiedName=StudyHub.Backend.UseCases.Tests.CourseServiceTests.GetAllCourses_ShouldReturnListOfCourses"
```

### Xem danh sách tất cả tests

```powershell
dotnet test --list-tests
```

## Packages sử dụng

- **xUnit** 2.9.2 - Test framework
- **Moq** 4.20.72 - Mocking library
