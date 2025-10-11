# Test Suite Documentation

This test suite provides comprehensive coverage for the Crypto Wallet Management API.

## Test Structure

```
tests/
├── setup.ts                    # Test setup and database configuration
├── helpers/
│   └── testHelpers.ts          # Utility functions for tests
├── unit/
│   ├── services/
│   │   ├── authService.test.ts     # Authentication service unit tests
│   │   ├── merchantService.test.ts # Merchant service unit tests
│   │   └── walletService.test.ts   # Wallet service unit tests
│   └── middleware/
│       └── auth.test.ts            # Authentication middleware unit tests
└── integration/
    ├── controllers/
    │   ├── authController.test.ts     # Auth endpoint integration tests
    │   ├── merchantController.test.ts # Merchant endpoint integration tests
    │   └── walletController.test.ts   # Wallet endpoint integration tests
    └── routes/
        └── index.test.ts              # Route mounting integration tests
```

## Test Coverage

### Endpoints Tested
- **Authentication Routes** (`/auth`)
  - `POST /auth/token` - JWT token generation
  
- **Merchant Routes** (`/merchant`)
  - `GET /merchant/profile` - Get merchant profile
  - `PUT /merchant/profile` - Update merchant profile
  
- **Wallet Routes** (`/wallet`)
  - `POST /wallet` - Create new wallet
  - `GET /wallet` - List merchant wallets
  - `GET /wallet/:id` - Get specific wallet

- **General Routes**
  - `GET /` - API information
  - `GET /health` - Health check

### Services Tested
- **AuthService**: JWT generation, token verification, password hashing
- **MerchantService**: Profile retrieval and updates
- **WalletService**: Wallet creation and management
- **Auth Middleware**: Token validation and user context

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/unit/services/authService.test.ts

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

## Test Features

### Unit Tests
- Mock external dependencies (database queries, models)
- Test business logic in isolation
- Comprehensive error handling scenarios
- Edge case validation

### Integration Tests
- Full HTTP request/response cycle
- Authentication flows
- Database interactions (with test database)
- Request validation
- Error responses

### Test Helpers
- `TestHelpers.createTestApp()` - Creates Elysia test app
- `TestHelpers.generateTestToken()` - Generates valid JWT tokens
- `TestHelpers.createAuthHeaders()` - Creates authentication headers
- `TestHelpers.expectSuccessResponse()` - Validates successful responses
- `TestHelpers.expectErrorResponse()` - Validates error responses

### Database Setup
- Automatic test data cleanup before/after each test
- Mock data fallback when database unavailable
- Test merchant and wallet creation utilities

## Test Scenarios Covered

### Authentication
- Valid credential authentication
- Invalid merchant ID/secret rejection
- Inactive merchant handling
- Token generation and verification
- Expired token handling
- Malformed token rejection

### Merchant Management
- Profile retrieval for authenticated users
- Profile updates (name, email)
- Validation error handling
- Duplicate email prevention
- Unauthenticated request rejection

### Wallet Management
- Wallet creation for different networks (Bitcoin, Ethereum, Polygon)
- Wallet listing by merchant
- Individual wallet retrieval
- Cross-merchant wallet access prevention
- Invalid network type rejection

### Middleware
- JWT token extraction from Bearer headers
- Token validation and user context creation
- Authentication requirement enforcement
- Invalid token handling

### Error Handling
- Database connection failures
- Malformed requests
- Validation errors
- Authentication failures
- Authorization failures

## Configuration

Tests use environment variables:
- `TEST_DATABASE_URL` - Test database connection (optional)
- `DATABASE_URL` - Fallback database connection
- `JWT_SECRET` - JWT signing secret

If no database is available, tests will use mock data where possible.