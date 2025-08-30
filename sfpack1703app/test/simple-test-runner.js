// Simple test runner for basic functionality
// This can run without complex testing frameworks

console.log('🧪 Starting Simple Test Runner...\n');

// Test utilities
const assert = {
  equal: (actual, expected, message) => {
    if (actual === expected) {
      console.log(`✅ PASS: ${message}`);
      return true;
    } else {
      console.log(`❌ FAIL: ${message}`);
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual: ${actual}`);
      return false;
    }
  },
  truthy: (value, message) => {
    if (value) {
      console.log(`✅ PASS: ${message}`);
      return true;
    } else {
      console.log(`❌ FAIL: ${message}`);
      return false;
    }
  },
  falsy: (value, message) => {
    if (!value) {
      console.log(`✅ PASS: ${message}`);
      return true;
    } else {
      console.log(`❌ FAIL: ${message}`);
      return false;
    }
  }
};

// Test suite
const testSuite = {
  name: 'Basic Functionality Tests',
  tests: [],
  addTest: function(name, testFn) {
    this.tests.push({ name, testFn });
  },
  run: function() {
    console.log(`\n📋 Running ${this.name}\n`);
    let passed = 0;
    let failed = 0;
    
    this.tests.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.name}`);
      try {
        const result = test.testFn();
        if (result !== false) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        failed++;
      }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }
};

// Add basic tests
testSuite.addTest('Basic arithmetic', () => {
  return assert.equal(2 + 2, 4, '2 + 2 should equal 4');
});

testSuite.addTest('String concatenation', () => {
  return assert.equal('Hello ' + 'World', 'Hello World', 'Strings should concatenate correctly');
});

testSuite.addTest('Boolean logic', () => {
  return assert.truthy(true, 'true should be truthy') &&
         assert.falsy(false, 'false should be falsy');
});

testSuite.addTest('Array operations', () => {
  const arr = [1, 2, 3];
  return assert.equal(arr.length, 3, 'Array should have correct length') &&
         assert.equal(arr[0], 1, 'Array should have correct first element');
});

testSuite.addTest('Object properties', () => {
  const obj = { name: 'Test', value: 42 };
  return assert.equal(obj.name, 'Test', 'Object should have correct name property') &&
         assert.equal(obj.value, 42, 'Object should have correct value property');
});

// Run tests
const results = testSuite.run();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
