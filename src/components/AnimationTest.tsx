import { useScrollAnimation } from '../utils/animations';

/**
 * Test component to verify scroll animations are working correctly
 * Place this temporarily in your app to test animation behavior
 */
export function AnimationTest() {
  const test1 = useScrollAnimation({ startVisible: true });
  const test2 = useScrollAnimation({ startVisible: false });
  const test3 = useScrollAnimation();

  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-2xl border-2 border-blue-500 max-w-sm">
      <h3 className="font-bold text-lg mb-3">🎬 Animation Tests</h3>
      
      <div className="space-y-4 text-sm">
        {/* Test 1: Should be visible immediately */}
        <div ref={test1.ref} className="space-y-1">
          <div className="font-semibold">Test 1: startVisible = true</div>
          <div className={`p-2 rounded transition-all duration-300 ${test1.isVisible ? 'bg-green-100 opacity-100' : 'bg-red-100 opacity-50'}`}>
            Status: {test1.isVisible ? '✅ Visible' : '❌ Hidden'}
          </div>
          <div className="text-xs text-gray-600">Should be visible immediately</div>
        </div>

        {/* Test 2: Should wait for scroll or timeout */}
        <div ref={test2.ref} className="space-y-1">
          <div className="font-semibold">Test 2: startVisible = false</div>
          <div className={`p-2 rounded transition-all duration-300 ${test2.isVisible ? 'bg-green-100 opacity-100' : 'bg-red-100 opacity-50'}`}>
            Status: {test2.isVisible ? '✅ Visible' : '⏳ Waiting...'}
          </div>
          <div className="text-xs text-gray-600">Should show after 2s timeout</div>
        </div>

        {/* Test 3: Default behavior (checks viewport) */}
        <div ref={test3.ref} className="space-y-1">
          <div className="font-semibold">Test 3: Auto-detect (default)</div>
          <div className={`p-2 rounded transition-all duration-300 ${test3.isVisible ? 'bg-green-100 opacity-100' : 'bg-yellow-100 opacity-50'}`}>
            Status: {test3.isVisible ? '✅ Visible' : '🔍 Checking viewport...'}
          </div>
          <div className="text-xs text-gray-600">Checks if in viewport on load</div>
        </div>
      </div>

      <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
        <strong>Expected:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Test 1: ✅ Immediately</li>
          <li>Test 2: ⏳ After 2 seconds</li>
          <li>Test 3: ✅ If in viewport, ⏳ else 2s</li>
        </ul>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Open console (F12) to see animation logs
      </div>
    </div>
  );
}
