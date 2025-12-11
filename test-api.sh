#!/bin/bash

# Test Script untuk Text Over Image API
# Usage: ./test-api.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${API_TOKEN:-}"
TEST_IMAGE="${TEST_IMAGE:-test.jpg}"

echo "========================================="
echo "Text Over Image API - Test Suite"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Test Image: $TEST_IMAGE"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Helper functions
print_test() {
    test_count=$((test_count + 1))
    echo ""
    echo "${YELLOW}[Test $test_count]${NC} $1"
}

print_pass() {
    pass_count=$((pass_count + 1))
    echo "${GREEN}✓ PASS${NC} $1"
}

print_fail() {
    fail_count=$((fail_count + 1))
    echo "${RED}✗ FAIL${NC} $1"
}

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo "${RED}Error: Test image '$TEST_IMAGE' not found${NC}"
    echo "Creating a test image using ImageMagick..."
    if command -v convert &> /dev/null; then
        convert -size 800x600 xc:blue -pointsize 48 -fill white -gravity center \
            -annotate +0+0 "Test Image" "$TEST_IMAGE"
        echo "${GREEN}Test image created: $TEST_IMAGE${NC}"
    else
        echo "${RED}Please provide a test image or install ImageMagick${NC}"
        exit 1
    fi
fi

# Test 1: Health Check
print_test "Health Check"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    print_pass "Health check successful (HTTP $http_code)"
    echo "$body" | jq -r '.message' 2>/dev/null || echo "$body"
else
    print_fail "Health check failed (HTTP $http_code)"
fi

# Test 2: Upload File - Binary (No Auth)
print_test "Upload File - Binary Response (No Auth)"
output_file="output/test-binary-noauth.jpg"
mkdir -p output

if [ -z "$TOKEN" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -F "image=@$TEST_IMAGE" \
        -F "address=Jakarta, Indonesia" \
        "$BASE_URL/upload" \
        -o "$output_file")
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        print_pass "Upload successful (HTTP $http_code)"
        ls -lh "$output_file"
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        print_fail "Auth required but no token provided (HTTP $http_code)"
    else
        print_fail "Upload failed (HTTP $http_code)"
    fi
else
    echo "Skipping (TOKEN is set, auth probably enabled)"
fi

# Test 3: Upload File - Binary (With Auth)
if [ -n "$TOKEN" ]; then
    print_test "Upload File - Binary Response (With Auth)"
    output_file="output/test-binary-auth.jpg"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -F "image=@$TEST_IMAGE" \
        -F "address=Jl. Sudirman No. 123, Jakarta" \
        "$BASE_URL/upload" \
        -o "$output_file")
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        print_pass "Upload with auth successful (HTTP $http_code)"
        ls -lh "$output_file"
    else
        print_fail "Upload with auth failed (HTTP $http_code)"
    fi
fi

# Test 4: Upload File - JSON Response
print_test "Upload File - JSON Response"
auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -F "image=@$TEST_IMAGE" \
    -F "address=Jakarta" \
    "$BASE_URL/upload?format=json")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    success=$(echo "$body" | jq -r '.success' 2>/dev/null)
    if [ "$success" = "true" ]; then
        print_pass "JSON response successful (HTTP $http_code)"
        echo "$body" | jq -r '.message, .data.size' 2>/dev/null
    else
        print_fail "JSON response invalid"
    fi
else
    print_fail "JSON upload failed (HTTP $http_code)"
fi

# Test 5: Upload from URL - Binary
print_test "Upload from URL - Binary Response"
output_file="output/test-url-binary.jpg"

auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -H "Content-Type: application/json" \
    -d '{"url":"https://picsum.photos/800/600","address":"Jakarta, Indonesia","format":"binary"}' \
    "$BASE_URL/upload-url" \
    -o "$output_file")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "200" ]; then
    print_pass "URL upload successful (HTTP $http_code)"
    ls -lh "$output_file"
else
    print_fail "URL upload failed (HTTP $http_code)"
fi

# Test 6: Upload with Long Address (Auto Wrap)
print_test "Upload with Long Address (Auto Wrap Test)"
output_file="output/test-long-address.jpg"
long_address="Jl. Jenderal Sudirman No. 123, RT.001/RW.002, Kelurahan Karet Tengsin, Kecamatan Tanah Abang, Jakarta Pusat, DKI Jakarta 10250"

auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -F "image=@$TEST_IMAGE" \
    -F "address=$long_address" \
    "$BASE_URL/upload" \
    -o "$output_file")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "200" ]; then
    print_pass "Long address upload successful (HTTP $http_code)"
    ls -lh "$output_file"
    echo "Check the output image to verify address wrapping"
else
    print_fail "Long address upload failed (HTTP $http_code)"
fi

# Test 7: Invalid Image Format
print_test "Invalid Image Format (Should Fail)"
echo "This is not an image" > output/fake.txt

auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -F "image=@output/fake.txt" \
    "$BASE_URL/upload")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "400" ]; then
    print_pass "Correctly rejected invalid format (HTTP $http_code)"
else
    print_fail "Should have rejected invalid format (HTTP $http_code)"
fi

rm -f output/fake.txt

# Test 8: Missing Image (Should Fail)
print_test "Missing Image File (Should Fail)"

auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -F "address=Jakarta" \
    "$BASE_URL/upload")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "400" ]; then
    print_pass "Correctly rejected missing image (HTTP $http_code)"
else
    print_fail "Should have rejected missing image (HTTP $http_code)"
fi

# Test 9: Invalid URL (Should Fail)
print_test "Invalid URL (Should Fail)"

auth_header=""
[ -n "$TOKEN" ] && auth_header="-H \"Authorization: Bearer $TOKEN\""

response=$(eval curl -s -w "\n%{http_code}" -X POST \
    $auth_header \
    -H "Content-Type: application/json" \
    -d '{"url":"not-a-valid-url","format":"binary"}' \
    "$BASE_URL/upload-url")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "400" ]; then
    print_pass "Correctly rejected invalid URL (HTTP $http_code)"
else
    print_fail "Should have rejected invalid URL (HTTP $http_code)"
fi

# Test 10: Check if auth is working (if token provided)
if [ -n "$TOKEN" ]; then
    print_test "Auth Test - Request without token (Should Fail)"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -F "image=@$TEST_IMAGE" \
        "$BASE_URL/upload")
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        print_pass "Auth correctly blocking unauthorized request (HTTP $http_code)"
    else
        print_fail "Auth should block request without token (HTTP $http_code)"
    fi
fi

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Tests: $test_count"
echo "${GREEN}Passed: $pass_count${NC}"
echo "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo "${RED}✗ Some tests failed${NC}"
    exit 1
fi
